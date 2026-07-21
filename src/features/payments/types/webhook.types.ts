/**
 * Types liés aux webhooks de paiement.
 *
 * Indépendant de tout provider. L'adapter transforme le payload
 * spécifique au provider en NormalizedWebhookPayload.
 */

import type { PaymentProvider } from "./payment.types";

// ---------------------------------------------------------------------------
// Payload normalisé
// ---------------------------------------------------------------------------

/**
 * Payload webhook normalisé, indépendant du provider.
 * Produit par l'adapter à partir du payload brut.
 */
export interface NormalizedWebhookPayload {
  readonly provider: PaymentProvider;
  readonly providerTxId: string;
  readonly providerRef: string;
  readonly status: WebhookStatus;
  readonly amount: number;
  readonly currency: string;
  /** Notre référence commande (merchantReference = order.number). */
  readonly orderReference: string;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly receivedAt: Date;
}

/** Statut contenu dans un webhook. */
export type WebhookStatus = "SUCCESS" | "FAILED" | "EXPIRED";

// ---------------------------------------------------------------------------
// Payload brut
// ---------------------------------------------------------------------------

/**
 * Payload brut reçu avant transformation.
 * Conservé pour audit, jamais exposé au frontend.
 */
export interface RawWebhookPayload {
  /** Corps HTTP brut. */
  readonly rawBody: unknown;
  /** Signature HTTP (header). */
  readonly signature: string;
  /** IP émettrice du webhook. */
  readonly remoteIp: string;
  /** Provider ayant émis ce webhook. */
  readonly provider: PaymentProvider;
}

// ---------------------------------------------------------------------------
// Résultat du traitement
// ---------------------------------------------------------------------------

/** Résultat du traitement d'un webhook (discriminated union). */
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
      /** Pourquoi le webhook n'a pas été traité. */
      readonly reason:
        | "DUPLICATE"
        | "AMOUNT_MISMATCH"
        | "CURRENCY_MISMATCH"
        | "PROVIDER_VERIFICATION_FAILED"
        | "ORDER_NOT_FOUND";
    };
