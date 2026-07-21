/**
 * Codes et classes d'erreur du module paiement.
 *
 * Chaque erreur est identifiée par un code unique.
 * La classe PaymentError transporte le code, le message, le statut HTTP
 * et des détails optionnels.
 */

// ---------------------------------------------------------------------------
// Codes d'erreur
// ---------------------------------------------------------------------------

export const PaymentErrorCode = {
  // Initiation (4xx)
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_NOT_YOURS: "ORDER_NOT_YOURS",
  ORDER_ALREADY_PAID: "ORDER_ALREADY_PAID",
  ORDER_PROCESSING: "ORDER_PROCESSING",
  TRANSACTION_EXISTS: "TRANSACTION_EXISTS",
  IDEMPOTENCY_KEY_USED: "IDEMPOTENCY_KEY_USED",
  AMOUNT_INVALID: "AMOUNT_INVALID",
  RATE_LIMITED: "RATE_LIMITED",

  // Provider (5xx)
  PROVIDER_ERROR: "PROVIDER_ERROR",
  PROVIDER_TIMEOUT: "PROVIDER_TIMEOUT",
  PROVIDER_CONFIG_MISSING: "PROVIDER_CONFIG_MISSING",
  PROVIDER_UNREACHABLE: "PROVIDER_UNREACHABLE",

  // Webhook
  WEBHOOK_SIGNATURE_INVALID: "WEBHOOK_SIGNATURE_INVALID",
  WEBHOOK_PAYLOAD_INVALID: "WEBHOOK_PAYLOAD_INVALID",
  WEBHOOK_AMOUNT_MISMATCH: "WEBHOOK_AMOUNT_MISMATCH",
  WEBHOOK_CURRENCY_MISMATCH: "WEBHOOK_CURRENCY_MISMATCH",

  // Téléchargement
  ORDER_NOT_PAID: "ORDER_NOT_PAID",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",

  // Transaction
  TRANSACTION_EXPIRED: "TRANSACTION_EXPIRED",
} as const;

export type PaymentErrorCode = (typeof PaymentErrorCode)[keyof typeof PaymentErrorCode];

// ---------------------------------------------------------------------------
// Mapping HTTP
// ---------------------------------------------------------------------------

/** Statut HTTP associé à chaque code d'erreur. */
export const PaymentErrorHttpStatus: Record<PaymentErrorCode, number> = {
  ORDER_NOT_FOUND: 404,
  ORDER_NOT_YOURS: 403,
  ORDER_ALREADY_PAID: 409,
  ORDER_PROCESSING: 409,
  TRANSACTION_EXISTS: 409,
  IDEMPOTENCY_KEY_USED: 409,
  AMOUNT_INVALID: 400,
  RATE_LIMITED: 429,
  PROVIDER_ERROR: 502,
  PROVIDER_TIMEOUT: 504,
  PROVIDER_CONFIG_MISSING: 500,
  PROVIDER_UNREACHABLE: 502,
  WEBHOOK_SIGNATURE_INVALID: 401,
  WEBHOOK_PAYLOAD_INVALID: 400,
  WEBHOOK_AMOUNT_MISMATCH: 422,
  WEBHOOK_CURRENCY_MISMATCH: 422,
  ORDER_NOT_PAID: 403,
  FILE_NOT_FOUND: 404,
  TRANSACTION_EXPIRED: 410,
};

// ---------------------------------------------------------------------------
// Classe d'erreur
// ---------------------------------------------------------------------------

/**
 * Erreur métier du module paiement.
 * Transporte un code unique, un message lisible,
 * le statut HTTP correspondant et des détails optionnels.
 */
export class PaymentError extends Error {
  public readonly code: PaymentErrorCode;
  public readonly httpStatus: number;
  public readonly details?: unknown;

  constructor(code: PaymentErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.httpStatus = PaymentErrorHttpStatus[code];
    this.details = details;
  }

  /** Sérialisation pour les logs et l'API. */
  toJSON(): {
    code: PaymentErrorCode;
    message: string;
    httpStatus: number;
  } {
    return {
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
    };
  }
}
