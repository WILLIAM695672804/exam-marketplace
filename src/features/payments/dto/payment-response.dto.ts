/**
 * DTOs de réponse standard pour les endpoints de paiement.
 *
 * Toute réponse d'API de paiement suit ce format.
 * Les données brutes du provider ne sont JAMAIS exposées.
 */

import type { PaymentErrorCode } from "../errors/payment.errors";

// ---------------------------------------------------------------------------
// Réponse standard
// ---------------------------------------------------------------------------

/** Enveloppe de réponse pour tous les endpoints de paiement. */
export interface PaymentApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: PaymentErrorResponse | null;
}

/** Contenu d'une erreur dans la réponse. */
export interface PaymentErrorResponse {
  readonly code: PaymentErrorCode;
  readonly message: string;
}

// ---------------------------------------------------------------------------
// Réponse d'initiation
// ---------------------------------------------------------------------------

/** Réponse renvoyée au frontend après initiation. */
export interface InitiatePaymentApiResponse {
  readonly transactionId: string;
  readonly status: "PENDING" | "FAILED";
  readonly provider: string;
}

// ---------------------------------------------------------------------------
// Réponse de statut
// ---------------------------------------------------------------------------

/** Réponse renvoyée au frontend pour une demande de statut. */
export interface PaymentStatusApiResponse {
  readonly orderId: string;
  readonly orderStatus: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  readonly transaction: {
    readonly transactionId: string;
    readonly status: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";
    readonly amount: number;
    readonly paidAt: string | null;
  } | null;
}
