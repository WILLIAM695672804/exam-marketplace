/**
 * DTO pour le payload de webhook.
 *
 * Le RawWebhookPayload est reçu, le NormalizedWebhookPayload
 * est produit par l'adapter, le WebhookProcessingResult est
 * le résultat du traitement par le WebhookService.
 *
 * Réexporte également les types depuis types/webhook.types.ts
 * pour centraliser les imports.
 */

// ---------------------------------------------------------------------------
// Payload brut (entrée HTTP)
// ---------------------------------------------------------------------------

/** Payload brut reçu sur la route webhook. */
export interface RawWebhookPayload {
  /** Corps HTTP brut (conservé pour audit, jamais renvoyé au frontend). */
  readonly rawBody: unknown;
  /** Signature HTTP (header). */
  readonly signature: string;
  /** IP émettrice. */
  readonly remoteIp: string;
}

// ---------------------------------------------------------------------------
// Payload normalisé (après adapter)
// ---------------------------------------------------------------------------

/**
 * Payload normalisé, indépendant du provider.
 * Produit par IPaymentProvider.normalizeWebhookPayload().
 */
export interface NormalizedWebhookPayload {
  readonly provider: string;
  readonly providerTxId: string;
  readonly providerRef: string;
  readonly status: "SUCCESS" | "FAILED" | "EXPIRED";
  readonly amount: number;
  readonly currency: string;
  /** Notre référence commande (merchantReference = order.number). */
  readonly orderReference: string;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly receivedAt: Date;
}

// ---------------------------------------------------------------------------
// Résultat du traitement
// ---------------------------------------------------------------------------

/**
 * Résultat du traitement d'un webhook (discriminated union).
 * - processed: true → traitement effectué
 * - processed: false → webhook ignoré (raison indiquée)
 */
export type WebhookProcessingResult =
  | {
      readonly processed: true;
      readonly orderId: string;
      readonly transactionId: string;
      readonly newStatus: "SUCCESS" | "FAILED" | "EXPIRED";
      readonly orderStatus: "PAID" | "CANCELLED" | "EXPIRED";
    }
  | {
      readonly processed: false;
      readonly reason:
        | "DUPLICATE"
        | "AMOUNT_MISMATCH"
        | "CURRENCY_MISMATCH"
        | "PROVIDER_VERIFICATION_FAILED"
        | "ORDER_NOT_FOUND";
    };
