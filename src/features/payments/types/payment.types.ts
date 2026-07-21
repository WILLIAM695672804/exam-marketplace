/**
 * Types partagés du domaine paiement.
 *
 * Dépendances : aucune (sauf errors/ pour le type d'erreur).
 * Ces types sont utilisés par tous les autres modules du domaine.
 */

import type { PaymentErrorCode } from "../errors/payment.errors";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/** Providers supportés. */
export type PaymentProvider = "FAPSHI" | "NOTCHPAY" | "CAMPAY" | "STRIPE";

// ---------------------------------------------------------------------------
// Statuts
// ---------------------------------------------------------------------------

/** Statut d'une transaction de paiement. */
export type PaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED";

/** Statut d'une commande en lien avec le paiement. */
export type OrderPaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";

// ---------------------------------------------------------------------------
// Résultat de paiement
// ---------------------------------------------------------------------------

/** Résultat d'une opération de paiement. */
export interface PaymentResult {
  readonly transactionId: string;
  readonly provider: PaymentProvider;
  readonly providerTxId: string | null;
  readonly status: PaymentStatus;
  readonly amount: number;
  readonly paidAt: Date | null;
}

// ---------------------------------------------------------------------------
// Événements internes
// ---------------------------------------------------------------------------

/** Types d'événements émis par le module paiement. */
export type PaymentEventType =
  | "PAYMENT_INITIATED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "PAYMENT_EXPIRED"
  | "WEBHOOK_RECEIVED"
  | "WEBHOOK_PROCESSED"
  | "COMMISSION_CALCULATED";

/** Événement interne du module paiement. */
export interface PaymentEvent {
  readonly type: PaymentEventType;
  readonly timestamp: Date;
  readonly orderId: string;
  readonly transactionId: string;
  readonly userId: string;
  readonly amount: number;
  readonly provider: PaymentProvider;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Erreur typée
// ---------------------------------------------------------------------------

/** Erreur structurée retournée par les opérations de paiement. */
export interface PaymentOperationError {
  readonly code: PaymentErrorCode;
  readonly message: string;
  readonly httpStatus: number;
  readonly transactionId?: string;
  readonly providerTxId?: string;
}
