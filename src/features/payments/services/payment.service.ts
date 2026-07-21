/**
 * Service d'orchestration des paiements.
 *
 * Responsabilité : coordonner l'initiation d'un paiement du début à la fin.
 *
 * Flux :
 *   1. Valider les entrées (Zod)
 *   2. Vérifier l'éligibilité de la commande (guards)
 *   3. Vérifier l'idempotence (clé déjà utilisée ?)
 *   4. Créer la transaction en base
 *   5. Appeler le provider via l'adapter
 *   6. Mettre à jour la transaction avec le résultat
 *   7. Retourner un DTO propre au client
 *
 * Ce service ne calcule JAMAIS les commissions.
 * Ce service n'accède JAMAIS directement à Prisma ou à Fapshi.
 */

import { initiatePaymentSchema } from "../validators/payment.schema";
import type { InitiatePaymentInput } from "../validators/payment.schema";
import type {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from "../dto/initiate-payment.dto";
import { PaymentError } from "../errors/payment.errors";
import type { IPaymentProvider } from "../adapters/payment-provider.interface";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { PaymentOrderRepository } from "../repositories/order.repository";

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class PaymentService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly orderRepo: PaymentOrderRepository,
    private readonly paymentProvider: IPaymentProvider
  ) {}

  // -----------------------------------------------------------------------
  // Initiation
  // -----------------------------------------------------------------------

  /**
   * Initie un paiement pour une commande.
   *
   * @param request Données envoyées par le frontend (orderId + idempotencyKey).
   * @param userId ID de l'utilisateur connecté.
   * @param ipAddress IP de l'utilisateur (pour audit).
   * @param userAgent User-Agent de l'utilisateur (pour audit).
   * @returns DTO de réponse (transactionId + status).
   */
  async initiate(
    request: InitiatePaymentRequest,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<InitiatePaymentResponse> {
    // 1. Validation des entrées
    const input = this.validateInput(request);

    // 2. Récupération de la commande
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new PaymentError(
        "ORDER_NOT_FOUND",
        `Commande ${input.orderId} introuvable.`
      );
    }

    // 3. Vérifications d'éligibilité (guards)
    this.guardOrderBelongsToUser(order.userId, userId);
    this.guardOrderIsPending(order.status);
    this.guardAmountIsPositive(Number(order.totalAmount));

    // 4. Vérifications anti-doublon
    await this.guardNoSuccessTransaction(input.orderId);
    await this.guardNoPendingTransaction(input.orderId);

    // 5. Idempotence : clé déjà utilisée ?
    const existing = await this.transactionRepo.findByIdempotencyKey(
      input.idempotencyKey
    );
    if (existing) {
      return {
        transactionId: existing.id,
        status: existing.status === "PENDING" ? "PENDING" : "FAILED",
        provider: existing.provider,
      };
    }

    // 6. Création de la transaction (INITIATED)
    const transaction = await this.transactionRepo.create({
      orderId: input.orderId,
      provider: this.paymentProvider.providerName as "FAPSHI",
      merchantReference: order.number,
      amount: Number(order.totalAmount),
      currency: "XAF",
      idempotencyKey: input.idempotencyKey,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    // 7. Appel au provider via l'adapter
    try {
      const user = order.user as {
        email: string;
        phone?: string | null;
        firstName?: string;
        lastName?: string;
      };

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const providerResponse = await this.paymentProvider.initiatePayment({
        amount: Number(order.totalAmount),
        currency: "XAF",
        reference: order.number,
        email: user.email,
        phone: user.phone ?? "",
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : undefined,
        redirectUrl: `${appUrl}/dashboard/commandes`,
        metadata: {
          orderId: order.id,
          userId,
          idempotencyKey: input.idempotencyKey,
        },
      });

      // 8. Succès → PENDING
      await this.transactionRepo.markPending(
        transaction.id,
        providerResponse.providerTxId,
        providerResponse.providerRef
      );

      return {
        transactionId: transaction.id,
        status: "PENDING",
        provider: this.paymentProvider.providerName,
        paymentUrl: providerResponse.paymentUrl,
      };
    } catch (error) {
      // 9. Échec technique → FAILED + incrémenter les tentatives
      const errorCode =
        error instanceof PaymentError ? error.code : "PROVIDER_UNREACHABLE";
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      await this.transactionRepo.markFailed(transaction.id, errorMessage);
      await this.transactionRepo.incrementAttempts(
        transaction.id,
        errorCode,
        error instanceof Error ? { message: error.message } : undefined
      );

      return {
        transactionId: transaction.id,
        status: "FAILED",
        provider: this.paymentProvider.providerName,
      };
    }
  }

  /**
   * Vérifie le statut d'un paiement (mécanisme de secours).
   * Utilisé par le bouton "Vérifier mon paiement" et le job de réconciliation.
   *
   * @param orderId ID de la commande.
   * @returns Le statut actuel de la transaction la plus récente, ou null.
   */
  async verify(orderId: string) {
    const transaction =
      await this.transactionRepo.findLatestByOrderId(orderId);
    if (!transaction || !transaction.providerTxId) {
      return null;
    }

    // Vérifier auprès du provider (double vérification)
    const providerStatus = await this.paymentProvider.verifyPayment(
      transaction.providerTxId
    );

    // Si le provider dit SUCCESS mais notre transaction est toujours PENDING → réconcilier
    if (
      providerStatus.verified &&
      transaction.status === "PENDING"
    ) {
      await this.transactionRepo.markSuccess(transaction.id);
      return {
        transactionId: transaction.id,
        verified: true,
        status: "SUCCESS" as const,
      };
    }

    return {
      transactionId: transaction.id,
      verified: providerStatus.verified,
      status: transaction.status,
    };
  }

  // -----------------------------------------------------------------------
  // Guards (méthodes privées)
  // -----------------------------------------------------------------------

  /**
   * Valide les entrées avec le schéma Zod.
   * Lève une PaymentError si la validation échoue.
   */
  private validateInput(request: InitiatePaymentRequest): InitiatePaymentInput {
    const result = initiatePaymentSchema.safeParse(request);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => i.message)
        .join(", ");
      throw new PaymentError("AMOUNT_INVALID", message);
    }
    return result.data;
  }

  /**
   * Vérifie que la commande appartient bien à l'utilisateur.
   */
  private guardOrderBelongsToUser(
    orderUserId: string,
    currentUserId: string
  ): void {
    if (orderUserId !== currentUserId) {
      throw new PaymentError(
        "ORDER_NOT_YOURS",
        "Cette commande ne vous appartient pas."
      );
    }
  }

  /**
   * Vérifie que la commande est toujours en attente de paiement.
   */
  private guardOrderIsPending(status: string): void {
    if (status === "PAID") {
      throw new PaymentError(
        "ORDER_ALREADY_PAID",
        "Cette commande a déjà été payée."
      );
    }
    if (status === "CANCELLED" || status === "EXPIRED") {
      throw new PaymentError(
        "ORDER_PROCESSING",
        `Cette commande est ${status.toLowerCase()}, le paiement n'est plus possible.`
      );
    }
  }

  /**
   * Vérifie que le montant est strictement positif.
   */
  private guardAmountIsPositive(amount: number): void {
    if (amount <= 0) {
      throw new PaymentError(
        "AMOUNT_INVALID",
        "Le montant de la commande doit être strictement positif."
      );
    }
  }

  /**
   * Vérifie qu'aucune transaction réussie n'existe déjà pour cette commande.
   */
  private async guardNoSuccessTransaction(orderId: string): Promise<void> {
    const exists = await this.transactionRepo.hasSuccessTransaction(orderId);
    if (exists) {
      throw new PaymentError(
        "ORDER_ALREADY_PAID",
        "Un paiement réussi existe déjà pour cette commande."
      );
    }
  }

  /**
   * Vérifie qu'aucune transaction en cours n'existe déjà pour cette commande.
   */
  private async guardNoPendingTransaction(orderId: string): Promise<void> {
    const exists = await this.transactionRepo.hasPendingTransaction(orderId);
    if (exists) {
      throw new PaymentError(
        "ORDER_PROCESSING",
        "Un paiement est déjà en cours pour cette commande."
      );
    }
  }
}
