/**
 * Types liés aux providers de paiement.
 *
 * Indépendant de tout provider concret.
 * Chaque provider (Fapshi, Campay, Stripe) est une implémentation de IPaymentProvider.
 */

import type { PaymentProvider } from "./payment.types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration requise pour un provider. */
export interface ProviderConfig {
  readonly name: PaymentProvider;
  readonly apiKey: string;
  readonly apiSecret?: string;
  readonly baseUrl: string;
  readonly webhookSecret: string;
  readonly timeoutMs: number;
  readonly maxRetries: number;
}

// ---------------------------------------------------------------------------
// Capacités
// ---------------------------------------------------------------------------

/** Fonctionnalités supportées par un provider. */
export interface ProviderCapabilities {
  readonly directPay: boolean;
  readonly webhook: boolean;
  readonly refund: boolean;
  readonly partialRefund: boolean;
  readonly recurringPayment: boolean;
  readonly currencies: readonly string[];
}

// ---------------------------------------------------------------------------
// Statut provider
// ---------------------------------------------------------------------------

/** Statut d'une transaction côté provider (discriminated union). */
export type ProviderTransactionStatus =
  | {
      readonly status: "SUCCESS";
      readonly providerTxId: string;
      readonly providerRef: string;
      readonly amount: number;
      readonly currency: string;
      readonly paidAt: string;
    }
  | {
      readonly status: "PENDING";
      readonly providerTxId: string;
      readonly providerRef: string;
      readonly amount: number;
      readonly currency: string;
      readonly paidAt: null;
    }
  | {
      readonly status: "FAILED";
      readonly providerTxId: string;
      readonly providerRef: string;
      readonly amount: number;
      readonly currency: string;
      readonly paidAt: null;
      readonly failureReason?: string;
    }
  | {
      readonly status: "EXPIRED";
      readonly providerTxId: string;
      readonly providerRef: string;
      readonly amount: number;
      readonly currency: string;
      readonly paidAt: null;
    };

// ---------------------------------------------------------------------------
// Erreur provider
// ---------------------------------------------------------------------------

/** Erreur retournée par un provider. */
export interface ProviderError {
  readonly provider: PaymentProvider;
  readonly httpStatus: number;
  readonly code: string;
  readonly message: string;
  readonly isRetryable: boolean;
  readonly rawResponse?: unknown;
}
