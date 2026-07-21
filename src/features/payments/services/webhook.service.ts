/**
 * Service de traitement des webhooks de paiement.
 *
 * Responsabilité : traiter un webhook entrant de manière idempotente et sécurisée.
 *
 * Flux :
 *   1. Vérifier la signature HMAC (via l'adapter)
 *   2. Normaliser le payload (via l'adapter)
 *   3. Vérifier l'idempotence (providerTxId déjà traité ?)
 *   4. Récupérer la commande (via le repository)
 *   5. Vérifier les montants et la devise
 *   6. Double vérification auprès du provider
 *   7. Mettre à jour transaction + commande (via les repositories)
 *   8. Déclencher le calcul des commissions (via CommissionService)
 *
 * Ce service ne fait JAMAIS d'appel HTTP direct à Fapshi.
 * Ce service n'accède JAMAIS directement à Prisma.
 */

import type { WebhookProcessingResult } from "../dto/webhook-payload.dto";
import { PaymentError } from "../errors/payment.errors";
import type { IPaymentProvider } from "../adapters/payment-provider.interface";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { PaymentOrderRepository } from "../repositories/order.repository";

// ---------------------------------------------------------------------------
// Interface minimale pour le CommissionService (injection de dépendance)
// ---------------------------------------------------------------------------

export interface ICommissionCalculator {
  calculate(transactionId: string, orderId: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class WebhookService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly orderRepo: PaymentOrderRepository,
    private readonly paymentProvider: IPaymentProvider,
    private readonly commissionService: ICommissionCalculator
  ) {}

  // -----------------------------------------------------------------------
  // Traitement principal
  // -----------------------------------------------------------------------

  /**
   * Traite un webhook entrant.
   *
   * @param rawBody Corps brut du webhook (Buffer reçu par la route API).
   * @param signatureHeader Valeur du header de signature HTTP.
   * @param remoteIp IP émettrice du webhook.
   * @returns Résultat du traitement (discriminated union).
   */
  async process(
    rawBody: string,
    signatureHeader: string,
    _remoteIp: string
  ): Promise<WebhookProcessingResult> {
    // 1. Vérification de la signature HMAC
    const signatureValid = this.paymentProvider.verifyWebhookSignature(rawBody, signatureHeader);
    if (!signatureValid) {
      throw new PaymentError("WEBHOOK_SIGNATURE_INVALID", "Signature du webhook invalide.");
    }

    // 2. Normalisation du payload (Fapshi → format interne)
    const parsed = JSON.parse(rawBody) as unknown;
    const payload = this.paymentProvider.normalizeWebhookPayload(parsed);

    // 3. Idempotence : providerTxId déjà traité ?
    const existingTx = await this.transactionRepo.findByProviderTxId(payload.providerTxId);
    if (existingTx && existingTx.status !== "PENDING") {
      return {
        processed: false,
        reason: "DUPLICATE",
      };
    }

    // 4. Récupération de la commande
    const order = await this.orderRepo.findByNumber(payload.orderReference);
    if (!order) {
      return {
        processed: false,
        reason: "ORDER_NOT_FOUND",
      };
    }

    // 5. Vérification des montants et de la devise
    const orderAmount = Number(order.totalAmount);
    if (payload.amount !== orderAmount) {
      // Journaliser l'incident mais traiter quand même
      console.error(
        `[CRITICAL] Montant webhook ${payload.amount} ≠ montant commande ${orderAmount} pour ${order.number}`
      );
      return {
        processed: false,
        reason: "AMOUNT_MISMATCH",
      };
    }
    if (payload.currency !== "XAF") {
      console.error(`[CRITICAL] Devise webhook ${payload.currency} ≠ XAF pour ${order.number}`);
      return {
        processed: false,
        reason: "CURRENCY_MISMATCH",
      };
    }

    // 6. Double vérification auprès du provider
    const verification = await this.paymentProvider.verifyPayment(payload.providerTxId);
    if (!verification || verification.status !== "SUCCESS") {
      return {
        processed: false,
        reason: "PROVIDER_VERIFICATION_FAILED",
      };
    }

    // 7. Sauvegarde du callback brut (audit)
    const txToUpdate = existingTx
      ? existingTx
      : await this.transactionRepo.findByMerchantReference(payload.orderReference);

    if (!txToUpdate) {
      return {
        processed: false,
        reason: "ORDER_NOT_FOUND",
      };
    }

    await this.transactionRepo.saveCallbackData(
      txToUpdate.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma InputJsonValue
      parsed as any
    );

    // 8. Traitement selon le statut du webhook
    switch (payload.status) {
      case "SUCCESS":
        return this.handleSuccess(txToUpdate.id, order.id);

      case "FAILED":
        return this.handleFailure(txToUpdate.id, order.id, "Paiement refusé par le provider");

      case "EXPIRED":
        return this.handleExpiry(txToUpdate.id, order.id, "Transaction expirée chez le provider");
    }
  }

  // -----------------------------------------------------------------------
  // Gestion des statuts
  // -----------------------------------------------------------------------

  /**
   * Traite un webhook SUCCESS :
   * - Marque la transaction SUCCESS
   * - Marque la commande PAID
   * - Déclenche le calcul des commissions
   */
  private async handleSuccess(
    transactionId: string,
    orderId: string
  ): Promise<WebhookProcessingResult> {
    await this.transactionRepo.markSuccess(transactionId);
    await this.orderRepo.markPaid(orderId);

    // Déclencher le calcul des commissions (ne bloque pas en cas d'erreur)
    try {
      await this.commissionService.calculate(transactionId, orderId);
    } catch (error) {
      console.error(
        `[ERROR] Échec calcul commission pour transaction ${transactionId}:`,
        error instanceof Error ? error.message : error
      );
      // On ne rollback pas le paiement pour une erreur de commission.
      // Un job de réconciliation corrigera plus tard.
    }

    return {
      processed: true,
      orderId,
      transactionId,
      newStatus: "SUCCESS",
      orderStatus: "PAID",
    };
  }

  /**
   * Traite un webhook FAILED.
   */
  private async handleFailure(
    transactionId: string,
    orderId: string,
    reason: string
  ): Promise<WebhookProcessingResult> {
    await this.transactionRepo.markFailed(transactionId, reason);
    await this.orderRepo.markCancelled(orderId);

    return {
      processed: true,
      orderId,
      transactionId,
      newStatus: "FAILED",
      orderStatus: "CANCELLED",
    };
  }

  /**
   * Traite un webhook EXPIRED.
   */
  private async handleExpiry(
    transactionId: string,
    orderId: string,
    reason: string
  ): Promise<WebhookProcessingResult> {
    await this.transactionRepo.markExpired(transactionId, reason);
    await this.orderRepo.markExpired(orderId);

    return {
      processed: true,
      orderId,
      transactionId,
      newStatus: "EXPIRED",
      orderStatus: "EXPIRED",
    };
  }
}
