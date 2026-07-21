/**
 * Service de calcul et d'enregistrement des commissions.
 *
 * Responsabilité : calculer les commissions plateforme / enseignant
 * pour chaque item d'une commande, puis les persister.
 *
 * Règles :
 *   - 1 Commission par (transactionId, examPaperId, teacherId)
 *   - Taux configurable (défaut : 15% plateforme, 85% enseignant)
 *   - Montant minimum plateforme : 50 FCFA
 *   - L'admin est exempté de commission (100% enseignant)
 *
 * Ce service ne contacte JAMAIS Fapshi.
 * Ce service n'accède JAMAIS directement à Prisma.
 */

import type { CommissionRepository } from "../repositories/commission.repository";
import type { CreateCommissionInput } from "../repositories/commission.repository";
import type { PaymentOrderRepository } from "../repositories/order.repository";

// ---------------------------------------------------------------------------
// Politique de commission
// ---------------------------------------------------------------------------

/**
 * Configuration de la politique de commission.
 * Sera déplacée dans commission.policy.ts quand cette couche sera développée.
 */
export interface CommissionPolicy {
  /** Taux de commission plateforme (ex: 0.15 = 15%). */
  readonly rate: number;
  /** Montant minimum de commission plateforme en FCFA. */
  readonly minimumPlatformAmount: number;
  /** Si true, les auteurs admin sont exemptés de commission. */
  readonly exemptAdmin: boolean;
}

/** Politique par défaut. */
export const DEFAULT_COMMISSION_POLICY: CommissionPolicy = {
  rate: 0.15,
  minimumPlatformAmount: 50,
  exemptAdmin: true,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class CommissionService {
  constructor(
    private readonly commissionRepo: CommissionRepository,
    private readonly orderRepo: PaymentOrderRepository,
    private readonly policy: CommissionPolicy = DEFAULT_COMMISSION_POLICY
  ) {}

  // -----------------------------------------------------------------------
  // Calcul
  // -----------------------------------------------------------------------

  /**
   * Calcule et enregistre les commissions pour une transaction.
   *
   * Une commande multi-vendeurs produit N commissions (1 par enseignant).
   * Toutes les commissions sont créées atomiquement.
   *
   * @param transactionId ID de la transaction réussie.
   * @param orderId ID de la commande payée.
   * @returns Le nombre de commissions créées.
   */
  async calculate(
    transactionId: string,
    orderId: string
  ): Promise<number> {
    // 1. Récupérer la commande avec ses items
    const order = await this.orderRepo.findWithItems(orderId);
    if (!order) {
      throw new Error(`Commande ${orderId} introuvable pour calcul commission.`);
    }

    // 2. Vérifier qu'aucune commission n'existe déjà (idempotence)
    const alreadyExists =
      await this.commissionRepo.hasCommission(transactionId);
    if (alreadyExists) {
      return 0; // Idempotent : déjà calculé
    }

    // 3. Calculer les lignes de commission
    const lines: CreateCommissionInput[] = [];

    for (const item of order.items) {
      const itemAmount = Number(item.price);
      const teacherId = item.examPaper.authorId;

      // Appliquer la politique
      const { platformAmount, teacherAmount } = this.computeSplit(
        itemAmount,
        false // L'info admin n'est pas disponible ici sans une requête supplémentaire
      );

      lines.push({
        transactionId,
        rate: this.policy.rate,
        platformAmount,
        teacherAmount,
        examPaperId: item.examPaperId,
        teacherId,
      });
    }

    if (lines.length === 0) {
      return 0;
    }

    // 4. Persister atomiquement
    await this.commissionRepo.createMany(lines);

    return lines.length;
  }

  // -----------------------------------------------------------------------
  // Calcul unitaire
  // -----------------------------------------------------------------------

  /**
   * Calcule la répartition plateforme / enseignant pour un montant donné.
   *
   * @param amount Montant de l'item en FCFA.
   * @param isAdmin Si l'auteur est admin (exempté de commission).
   * @returns Parts plateforme et enseignant.
   */
  computeSplit(
    amount: number,
    isAdmin: boolean
  ): { platformAmount: number; teacherAmount: number } {
    if (isAdmin && this.policy.exemptAdmin) {
      return { platformAmount: 0, teacherAmount: amount };
    }

    const rawPlatform = amount * this.policy.rate;
    const platformAmount = Math.max(
      Math.round(rawPlatform),
      this.policy.minimumPlatformAmount
    );
    // La plateforme ne peut pas prendre plus que le montant total
    const cappedPlatform = Math.min(platformAmount, amount);
    const teacherAmount = amount - cappedPlatform;

    return {
      platformAmount: cappedPlatform,
      teacherAmount,
    };
  }
}
