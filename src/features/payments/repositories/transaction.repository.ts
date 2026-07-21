/**
 * Repository d'accès aux données de la table Transaction.
 *
 * Responsabilité unique : lire et écrire des transactions dans PostgreSQL via Prisma.
 * Aucune logique métier, aucune validation, aucune décision.
 *
 * Les méthodes `mark*` sont des aides d'écriture atomique — le Service décide quand les appeler.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma, PaymentProvider, TransactionStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types d'entrée
// ---------------------------------------------------------------------------

/** Données de création d'une transaction. */
export interface CreateTransactionInput {
  readonly orderId: string;
  readonly provider: PaymentProvider;
  readonly merchantReference?: string;
  readonly amount: number;
  readonly currency?: string;
  readonly idempotencyKey?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

/** Données de mise à jour d'une transaction. */
export interface UpdateTransactionInput {
  readonly providerTxId?: string;
  readonly providerRef?: string;
  readonly merchantReference?: string;
  readonly status?: TransactionStatus;
  readonly statusReason?: string;
  readonly amount?: number;
  readonly idempotencyKey?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class TransactionRepository {
  private readonly db = prisma.transaction;

  // -----------------------------------------------------------------------
  // Création
  // -----------------------------------------------------------------------

  /**
   * Crée une nouvelle transaction avec le statut INITIATED.
   *
   * @param input Données de la transaction à créer.
   * @returns La transaction créée.
   */
  async create(input: CreateTransactionInput) {
    return this.db.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        merchantReference: input.merchantReference ?? null,
        amount: input.amount,
        currency: input.currency ?? "XAF",
        idempotencyKey: input.idempotencyKey ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        status: "INITIATED",
        attempts: 1,
        initiatedAt: new Date(),
        lastAttemptAt: new Date(),
      },
    });
  }

  // -----------------------------------------------------------------------
  // Lectures
  // -----------------------------------------------------------------------

  /**
   * Recherche une transaction par son ID.
   *
   * @param id UUID de la transaction.
   * @returns La transaction ou null.
   */
  async findById(id: string) {
    return this.db.findUnique({ where: { id } });
  }

  /**
   * Recherche les transactions liées à une commande.
   *
   * @param orderId UUID de la commande.
   * @returns Tableau de transactions ordonnées par date de création décroissante.
   */
  async findByOrderId(orderId: string) {
    return this.db.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Recherche la dernière transaction pour une commande.
   *
   * @param orderId UUID de la commande.
   * @returns La transaction la plus récente ou null.
   */
  async findLatestByOrderId(orderId: string) {
    return this.db.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Recherche une transaction par sa référence marchande (order.number).
   *
   * @param merchantReference Référence interne de la commande.
   * @returns La transaction ou null.
   */
  async findByMerchantReference(merchantReference: string) {
    return this.db.findFirst({
      where: { merchantReference },
    });
  }

  /**
   * Recherche une transaction par l'identifiant du provider.
   * Utilisé pour l'idempotence des webhooks.
   *
   * @param providerTxId Identifiant de transaction chez le provider (ex: Fapshi transId).
   * @returns La transaction ou null.
   */
  async findByProviderTxId(providerTxId: string) {
    return this.db.findUnique({
      where: { providerTxId },
    });
  }

  /**
   * Recherche une transaction par sa clé d'idempotence.
   * Utilisé pour l'anti double-clic.
   *
   * @param idempotencyKey Clé générée côté client.
   * @returns La transaction ou null.
   */
  async findByIdempotencyKey(idempotencyKey: string) {
    return this.db.findUnique({
      where: { idempotencyKey },
    });
  }

  /**
   * Recherche les transactions en attente depuis plus longtemps que la durée spécifiée.
   * Utilisé par le job de réconciliation.
   *
   * @param olderThan Date limite : les transactions initiées avant cette date sont retournées.
   * @returns Tableau de transactions PENDING ou INITIATED.
   */
  async findPendingTransactions(olderThan: Date) {
    return this.db.findMany({
      where: {
        status: { in: ["INITIATED", "PENDING"] },
        initiatedAt: { lt: olderThan },
      },
      orderBy: { initiatedAt: "asc" },
    });
  }

  // -----------------------------------------------------------------------
  // Mises à jour génériques
  // -----------------------------------------------------------------------

  /**
   * Met à jour les champs fournis d'une transaction.
   * Seuls les champs explicitement passés sont modifiés.
   *
   * @param id UUID de la transaction.
   * @param data Champs à mettre à jour.
   * @returns La transaction mise à jour.
   */
  async update(id: string, data: UpdateTransactionInput) {
    return this.db.update({
      where: { id },
      data,
    });
  }

  /**
   * Enregistre les données de callback / webhook dans la transaction.
   *
   * @param id UUID de la transaction.
   * @param callbackData Données brutes du webhook (stockées pour audit).
   */
  async saveCallbackData(
    id: string,
    callbackData: Prisma.InputJsonValue
  ) {
    return this.db.update({
      where: { id },
      data: { callbackData },
    });
  }

  /**
   * Incrémente atomiquement le compteur de tentatives techniques.
   * Appelé UNIQUEMENT pour les erreurs réseau/timeout, pas pour les relances volontaires.
   *
   * @param id UUID de la transaction.
   * @param errorCode Code erreur optionnel.
   * @param errorBody Détail erreur optionnel.
   * @returns La transaction mise à jour.
   */
  async incrementAttempts(
    id: string,
    errorCode?: string,
    errorBody?: Prisma.InputJsonValue
  ) {
    return this.db.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
        ...(errorCode ? { lastErrorCode: errorCode } : {}),
        ...(errorBody ? { lastErrorBody: errorBody } : {}),
      },
    });
  }

  // -----------------------------------------------------------------------
  // Transitions d'état (écritures atomiques)
  // -----------------------------------------------------------------------

  /**
   * Passe la transaction au statut PENDING et enregistre les données provider.
   * Appelé après une réponse réussie de Fapshi.
   *
   * @param id UUID de la transaction.
   * @param providerTxId Identifiant transaction chez le provider.
   * @param providerRef Référence provider (optionnelle).
   * @returns La transaction mise à jour.
   */
  async markPending(
    id: string,
    providerTxId: string,
    providerRef?: string
  ) {
    return this.db.update({
      where: { id },
      data: {
        status: "PENDING",
        providerTxId,
        providerRef: providerRef ?? null,
      },
    });
  }

  /**
   * Passe la transaction au statut SUCCESS et enregistre la date de paiement.
   * Appelé après traitement réussi du webhook.
   *
   * @param id UUID de la transaction.
   * @param paidAt Date du paiement (par défaut now()).
   * @returns La transaction mise à jour.
   */
  async markSuccess(id: string, paidAt?: Date) {
    return this.db.update({
      where: { id },
      data: {
        status: "SUCCESS",
        paidAt: paidAt ?? new Date(),
      },
    });
  }

  /**
   * Passe la transaction au statut FAILED avec une raison.
   * Appelé après échec du paiement (webhook FAILED ou erreur irrécupérable).
   *
   * @param id UUID de la transaction.
   * @param reason Raison de l'échec (obligatoire).
   * @returns La transaction mise à jour.
   */
  async markFailed(id: string, reason: string) {
    return this.db.update({
      where: { id },
      data: {
        status: "FAILED",
        statusReason: reason,
      },
    });
  }

  /**
   * Passe la transaction au statut EXPIRED avec une raison.
   * Appelé après dépassement du timeout de 30 minutes.
   *
   * @param id UUID de la transaction.
   * @param reason Raison de l'expiration (ex: "Timeout 30min").
   * @returns La transaction mise à jour.
   */
  async markExpired(id: string, reason: string) {
    return this.db.update({
      where: { id },
      data: {
        status: "EXPIRED",
        statusReason: reason,
      },
    });
  }

  // -----------------------------------------------------------------------
  // Vérifications (lectures ciblées pour les guards)
  // -----------------------------------------------------------------------

  /**
   * Vérifie si une transaction SUCCESS existe déjà pour une commande.
   * Utilisé par le guard anti double-paiement.
   *
   * @param orderId UUID de la commande.
   * @returns true si une transaction réussie existe.
   */
  async hasSuccessTransaction(orderId: string): Promise<boolean> {
    const count = await this.db.count({
      where: {
        orderId,
        status: "SUCCESS",
      },
    });
    return count > 0;
  }

  /**
   * Vérifie si une transaction PENDING (non expirée) existe pour une commande.
   * Utilisé par le guard anti double-initiation.
   *
   * @param orderId UUID de la commande.
   * @returns true si une transaction en cours existe.
   */
  async hasPendingTransaction(orderId: string): Promise<boolean> {
    const count = await this.db.count({
      where: {
        orderId,
        status: { in: ["INITIATED", "PENDING"] },
      },
    });
    return count > 0;
  }
}
