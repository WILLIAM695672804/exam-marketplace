/**
 * Types liés aux transactions de paiement.
 *
 * Une Transaction représente une tentative de paiement unique auprès d'un provider.
 * En cas d'échec ou d'expiration, l'utilisateur crée une NOUVELLE Transaction.
 * Le champ `attempts` ne s'incrémente que pour les erreurs techniques.
 */

import type { PaymentProvider, PaymentStatus } from "./payment.types";

// ---------------------------------------------------------------------------
// Contexte d'initiation
// ---------------------------------------------------------------------------

/** Données nécessaires pour initier une transaction. */
export interface TransactionContext {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly userId: string;
  readonly userEmail: string;
  readonly amount: number;
  readonly currency: "XAF";
  readonly idempotencyKey: string;
  readonly items: readonly TransactionItem[];
}

/** Un item de la commande inclus dans la transaction. */
export interface TransactionItem {
  readonly examPaperId: string;
  readonly titleSnapshot: string;
  readonly price: number;
  readonly withCorrection: boolean;
  readonly authorId: string;
}

// ---------------------------------------------------------------------------
// États et transitions
// ---------------------------------------------------------------------------

/** États possibles d'une transaction. */
export type TransactionStatus = PaymentStatus;

/**
 * Transition autorisée entre deux statuts.
 * Discriminated union : chaque transition est explicite.
 */
export type TransactionTransition =
  | { readonly from: "INITIATED"; readonly to: "PENDING" | "EXPIRED" }
  | { readonly from: "PENDING"; readonly to: "SUCCESS" | "FAILED" | "EXPIRED" }
  | { readonly from: "SUCCESS"; readonly to: never } // Terminal
  | { readonly from: "FAILED"; readonly to: never } // Terminal
  | { readonly from: "EXPIRED"; readonly to: never }; // Terminal

/** Entrée de l'historique des statuts. */
export interface TransactionStatusEntry {
  readonly status: TransactionStatus;
  readonly at: Date;
  readonly reason?: string;
}

// ---------------------------------------------------------------------------
// Tentatives techniques
// ---------------------------------------------------------------------------

/** Détail d'une tentative d'appel au provider. */
export interface TransactionAttempt {
  readonly attemptNumber: number;
  readonly at: Date;
  readonly errorCode?: string;
  readonly errorBody?: unknown;
  readonly durationMs?: number;
}

// ---------------------------------------------------------------------------
// Données persistées (reflète la table Transaction)
// ---------------------------------------------------------------------------

/** Projection complète d'une transaction (lecture). */
export interface TransactionRecord {
  readonly id: string;
  readonly orderId: string;
  readonly provider: PaymentProvider;
  readonly merchantReference: string | null;
  readonly providerTxId: string | null;
  readonly providerRef: string | null;
  readonly amount: number;
  readonly currency: string;
  readonly status: TransactionStatus;
  readonly statusReason: string | null;
  readonly paidAt: Date | null;
  readonly idempotencyKey: string | null;
  readonly attempts: number;
  readonly lastAttemptAt: Date | null;
  readonly lastErrorCode: string | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly initiatedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
