/**
 * DTOs pour l'initiation d'un paiement.
 */

// ---------------------------------------------------------------------------
// Requête (frontend → backend)
// ---------------------------------------------------------------------------

/** Requête d'initiation envoyée par le frontend. */
export interface InitiatePaymentRequest {
  readonly orderId: string;
  readonly idempotencyKey: string;
}

// ---------------------------------------------------------------------------
// Réponse (backend → frontend)
// ---------------------------------------------------------------------------

/**
 * Réponse renvoyée au frontend après initiation.
 * Ne contient JAMAIS de données brutes du provider.
 */
export interface InitiatePaymentResponse {
  readonly transactionId: string;
  readonly status: "PENDING" | "FAILED";
  readonly provider: string;
  /** URL de redirection (Initiate Pay). Absent en Direct Pay. */
  readonly paymentUrl?: string;
}

// ---------------------------------------------------------------------------
// Résultat interne (adapter → service)
// ---------------------------------------------------------------------------

/** Résultat retourné par l'adapter après appel au provider. */
export interface InitiatePaymentResult {
  readonly transactionId: string;
  readonly providerTxId: string | null;
  readonly providerRef: string | null;
  readonly status: "PENDING" | "FAILED";
  readonly attempts: number;
  readonly errorCode?: string;
  readonly errorBody?: unknown;
}
