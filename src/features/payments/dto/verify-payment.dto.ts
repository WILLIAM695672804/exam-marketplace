/**
 * DTOs pour la vérification de paiement.
 *
 * Route GET /api/payments/verify — mécanisme de secours uniquement.
 * N'est JAMAIS le flux principal de confirmation (le webhook l'est).
 * Utilisé pour : bouton "Vérifier mon paiement", réconciliation, debug.
 */

// ---------------------------------------------------------------------------
// Requête
// ---------------------------------------------------------------------------

/** Requête de vérification (envoyée par le frontend). */
export interface VerifyPaymentRequest {
  readonly orderId: string;
}

// ---------------------------------------------------------------------------
// Réponse
// ---------------------------------------------------------------------------

/** Réponse de vérification (renvoyée au frontend). */
export interface VerifyPaymentResponse {
  readonly verified: boolean;
  readonly orderStatus: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  readonly transaction: VerifyPaymentTransaction | null;
}

/** Détail de la transaction vérifiée. */
export interface VerifyPaymentTransaction {
  readonly transactionId: string;
  readonly provider: string;
  readonly providerTxId: string | null;
  readonly status: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";
  readonly amount: number;
  readonly paidAt: string | null;
}

// ---------------------------------------------------------------------------
// Résultat interne
// ---------------------------------------------------------------------------

/** Résultat interne de la vérification côté provider. */
export interface VerifyPaymentResult {
  readonly verified: boolean;
  readonly providerTxId: string;
  readonly providerStatus: "SUCCESS" | "FAILED" | "PENDING" | "EXPIRED";
  readonly amount: number;
  readonly currency: string;
  readonly paidAt: string | null;
}
