/**
 * Repository d'accès aux données de la table Commission.
 *
 * Responsabilité unique : lire et écrire des commissions dans PostgreSQL via Prisma.
 * Aucune logique métier, aucun calcul, aucune validation.
 *
 * Note : la méthode delete() n'est PAS implémentée car l'architecture stipule
 * que les commissions ne sont jamais supprimées (règle §23 du document d'architecture).
 */

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types d'entrée
// ---------------------------------------------------------------------------

/** Données de création d'une commission. */
export interface CreateCommissionInput {
  readonly transactionId: string;
  readonly rate: number;
  readonly platformAmount: number;
  readonly teacherAmount: number;
  readonly examPaperId?: string;
  readonly teacherId?: string;
}

/** Données de mise à jour d'une commission. */
export interface UpdateCommissionInput {
  readonly rate?: number;
  readonly platformAmount?: number;
  readonly teacherAmount?: number;
  readonly examPaperId?: string | null;
  readonly teacherId?: string | null;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class CommissionRepository {
  private readonly db = prisma.commission;

  // -----------------------------------------------------------------------
  // Création
  // -----------------------------------------------------------------------

  /**
   * Crée une commission.
   *
   * @param input Données de la commission.
   * @returns La commission créée.
   */
  async create(input: CreateCommissionInput) {
    return this.db.create({
      data: {
        transactionId: input.transactionId,
        rate: input.rate,
        platformAmount: input.platformAmount,
        teacherAmount: input.teacherAmount,
        examPaperId: input.examPaperId ?? null,
        teacherId: input.teacherId ?? null,
      },
    });
  }

  /**
   * Crée plusieurs commissions en une opération atomique.
   * Utilisé pour une commande multi-vendeurs (1 commission par enseignant).
   *
   * @param inputs Données des commissions à créer.
   * @returns Le nombre de commissions créées.
   */
  async createMany(inputs: readonly CreateCommissionInput[]) {
    return prisma.$transaction(
      inputs.map((input) =>
        this.db.create({
          data: {
            transactionId: input.transactionId,
            rate: input.rate,
            platformAmount: input.platformAmount,
            teacherAmount: input.teacherAmount,
            examPaperId: input.examPaperId ?? null,
            teacherId: input.teacherId ?? null,
          },
        })
      )
    );
  }

  // -----------------------------------------------------------------------
  // Lectures
  // -----------------------------------------------------------------------

  /**
   * Recherche une commission par son ID.
   *
   * @param id UUID de la commission.
   * @returns La commission ou null.
   */
  async findById(id: string) {
    return this.db.findUnique({ where: { id } });
  }

  /**
   * Recherche toutes les commissions liées à une transaction.
   * Pour une commande multi-vendeurs, retourne plusieurs lignes.
   *
   * @param transactionId UUID de la transaction.
   * @returns Tableau de commissions.
   */
  async findByTransactionId(transactionId: string) {
    return this.db.findMany({
      where: { transactionId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Recherche les commissions d'un enseignant.
   *
   * @param teacherId UUID de l'enseignant.
   * @returns Tableau de commissions ordonnées par date décroissante.
   */
  async findByTeacherId(teacherId: string) {
    return this.db.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
    });
  }

  // -----------------------------------------------------------------------
  // Mise à jour
  // -----------------------------------------------------------------------

  /**
   * Met à jour les champs fournis d'une commission.
   * Seuls les champs explicitement passés sont modifiés.
   *
   * @param id UUID de la commission.
   * @param data Champs à mettre à jour.
   * @returns La commission mise à jour.
   */
  async update(id: string, data: UpdateCommissionInput) {
    return this.db.update({
      where: { id },
      data,
    });
  }

  // -----------------------------------------------------------------------
  // Vérifications
  // -----------------------------------------------------------------------

  /**
   * Vérifie si une commission existe déjà pour une transaction.
   *
   * @param transactionId UUID de la transaction.
   * @returns true si au moins une commission existe.
   */
  async hasCommission(transactionId: string): Promise<boolean> {
    const count = await this.db.count({
      where: { transactionId },
    });
    return count > 0;
  }
}

// ---------------------------------------------------------------------------
// Méthodes NON implémentées
// ---------------------------------------------------------------------------

/**
 * delete() n'est pas implémentée.
 *
 * Raison : le document d'architecture (§23 - Règles de suppression) stipule :
 * "Commission — Jamais supprimée. Même si remboursée."
 *
 * En cas de remboursement futur, un champ `reversedAt` sera ajouté
 * plutôt que de supprimer l'enregistrement.
 */
