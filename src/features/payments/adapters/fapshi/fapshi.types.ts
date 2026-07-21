/** DTOs spécifiques à l'API Fapshi. */

// ---------------------------------------------------------------------------
// Requête commune (Direct Pay + Initiate Pay)
// ---------------------------------------------------------------------------

export interface FapshiDirectPayRequest {
  amount: number;
  currency: "XAF";
  reference: string;
  email: string;
  /** Numéro de téléphone (requis). Format: 67XXXXXXX ou 69XXXXXXX. */
  phone: string;
  /** Moyen de paiement : "mobile money" (MTN) ou "orange money" (Orange). */
  medium: "mobile money" | "orange money";
  /** Nom de l'acheteur. */
  name?: string;
  /** Identifiant utilisateur dans notre système. */
  userId?: string;
  /** Identifiant externe pour le rapprochement (notre référence commande). */
  externalId?: string;
  /** Motif du paiement. */
  message?: string;
  /** URL de redirection après paiement (Initiate Pay). */
  redirectUrl?: string;
}

// ---------------------------------------------------------------------------
// Réponse Direct Pay
// ---------------------------------------------------------------------------

export interface FapshiDirectPayResponse {
  transId: string;
  message: string;
  dateInitiated: string;
}

// ---------------------------------------------------------------------------
// Réponse Initiate Pay
// ---------------------------------------------------------------------------

export interface FapshiInitiatePayResponse {
  transId: string;
  message: string;
  link: string;
  dateInitiated: string;
}

// ---------------------------------------------------------------------------
// Statut d'une transaction chez Fapshi
// ---------------------------------------------------------------------------

export interface FapshiTransactionStatus {
  transId: string;
  /** CREATED = Initiate Pay créé, SUCCESSFUL = payé, FAILED = échoué, EXPIRED = expiré */
  status: "CREATED" | "SUCCESSFUL" | "FAILED" | "PENDING" | "EXPIRED";
  amount: number;
  revenue: number;
  medium: string;
  email: string | null;
  externalId: string | null;
  userId: string | null;
  financialTransId: string;
  dateInitiated: string;
  dateConfirmed: string | null;
  webhook: string | null;
}

// ---------------------------------------------------------------------------
// Payload webhook reçu de Fapshi
// ---------------------------------------------------------------------------

export interface FapshiWebhookPayload {
  transId: string;
  /** Notre référence (order.number), passée dans externalId */
  externalId: string;
  status: "SUCCESSFUL" | "FAILED" | "EXPIRED";
  amount: number;
  currency: string;
  financialTransId: string;
  dateConfirmed: string | null;
  meta?: Record<string, string>;
}
