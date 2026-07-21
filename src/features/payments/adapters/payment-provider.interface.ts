/**
 * Contrat universel pour tout provider de paiement (Fapshi, Campay, Stripe, NotchPay).
 *
 * Changer de provider = implémenter cette interface. Rien d'autre à modifier.
 * Toute la logique métier (PaymentService, WebhookService) dépend uniquement
 * de cette interface, jamais d'une implémentation concrète.
 */

import type { NormalizedWebhookPayload } from "../types/webhook.types";
import type { ProviderTransactionStatus } from "../types/provider.types";

// ---------------------------------------------------------------------------
// Requête d'initiation envoyée au provider
// ---------------------------------------------------------------------------

/** Payload envoyé au provider pour initier un paiement Direct Pay. */
export interface ProviderInitiateRequest {
  readonly amount: number;
  readonly currency: "XAF";
  /** Notre référence commande (order.number). */
  readonly reference: string;
  readonly email: string;
  /** Numéro de téléphone (requis). */
  readonly phone: string;
  /** Nom de l'acheteur. */
  readonly name?: string;
  /** Moyen de paiement : "mobile money" (MTN) ou "orange money" (Orange). */
  readonly medium?: "mobile money" | "orange money";
  /** URL de redirection après paiement (Initiate Pay uniquement). */
  readonly redirectUrl?: string;
  readonly metadata: {
    readonly orderId: string;
    readonly userId: string;
    readonly idempotencyKey: string;
  };
}

// ---------------------------------------------------------------------------
// Réponse d'initiation
// ---------------------------------------------------------------------------

/** Réponse brute du provider à une initiation (jamais exposée au frontend). */
export interface ProviderInitiateResponse {
  readonly providerTxId: string;
  readonly providerRef: string;
  readonly status: "PENDING" | "FAILED";
  /** URL de paiement (Initiate Pay). undefined pour Direct Pay. */
  readonly paymentUrl?: string;
}

// ---------------------------------------------------------------------------
// Résultat de vérification
// ---------------------------------------------------------------------------

/** Résultat d'une vérification de transaction côté provider. */
export interface ProviderVerifyResult {
  readonly verified: boolean;
  readonly providerTxId: string;
  readonly providerRef: string;
  readonly status: "SUCCESS" | "FAILED" | "PENDING" | "EXPIRED";
  readonly amount: number;
  readonly currency: string;
  readonly paidAt: string | null;
}

// ---------------------------------------------------------------------------
// Contrat IPaymentProvider
// ---------------------------------------------------------------------------

export interface IPaymentProvider {
  // -----------------------------------------------------------------------
  // Paiement
  // -----------------------------------------------------------------------

  /**
   * Initie un paiement Direct Pay chez le provider.
   * Appelé par PaymentService.initiate().
   */
  initiatePayment(
    request: ProviderInitiateRequest
  ): Promise<ProviderInitiateResponse>;

  /**
   * Vérifie le statut d'une transaction directement auprès du provider.
   * Mécanisme de secours (pas le flux principal — le webhook l'est).
   * Appelé par : bouton "Vérifier mon paiement", job de réconciliation.
   */
  verifyPayment(providerTxId: string): Promise<ProviderVerifyResult>;

  /**
   * Récupère le statut complet d'une transaction.
   * Utilisé par les jobs de réconciliation.
   */
  getTransactionStatus(
    providerTxId: string
  ): Promise<ProviderTransactionStatus>;

  // -----------------------------------------------------------------------
  // Webhook
  // -----------------------------------------------------------------------

  /**
   * Transforme un payload webhook brut (spécifique au provider)
   * en NormalizedWebhookPayload (format standard).
   */
  normalizeWebhookPayload(rawBody: unknown): NormalizedWebhookPayload;

  /**
   * Vérifie la signature d'un webhook entrant.
   * Retourne true si la signature est valide.
   */
  verifyWebhookSignature(payload: unknown, signature: string): boolean;

  // -----------------------------------------------------------------------
  // Métadonnées
  // -----------------------------------------------------------------------

  /** Identifiant unique du provider. */
  readonly providerName: string;
}
