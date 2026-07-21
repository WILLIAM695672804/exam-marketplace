/**
 * Types liés aux commissions.
 *
 * Une commande peut contenir des épreuves de plusieurs enseignants.
 * → 1 Commission par (transaction, examPaperId, teacherId).
 */

// ---------------------------------------------------------------------------
// Taux et politique
// ---------------------------------------------------------------------------

/** Configuration de la politique de commission. */
export interface CommissionPolicy {
  /** Taux plateforme (ex: 0.15 = 15%). */
  readonly rate: number;
  /** Montant minimum de commission plateforme (en FCFA). */
  readonly minimumPlatformAmount: number;
  /** Si true, pas de commission quand l'auteur est admin. */
  readonly exemptAdmin: boolean;
}

// ---------------------------------------------------------------------------
// Calcul
// ---------------------------------------------------------------------------

/** Ligne de commission pour un item d'une commande. */
export interface CommissionLine {
  readonly examPaperId: string;
  readonly teacherId: string;
  readonly itemAmount: number;
  readonly rate: number;
  readonly platformAmount: number;
  readonly teacherAmount: number;
}

/** Résultat agrégé du calcul des commissions. */
export interface CommissionResult {
  readonly transactionId: string;
  readonly lines: readonly CommissionLine[];
  readonly platformTotal: number;
  readonly teacherTotal: number;
}

// ---------------------------------------------------------------------------
// Données persistées (reflète la table Commission)
// ---------------------------------------------------------------------------

/** Projection complète d'une commission (lecture). */
export interface CommissionRecord {
  readonly id: string;
  readonly transactionId: string;
  readonly rate: number;
  readonly platformAmount: number;
  readonly teacherAmount: number;
  readonly examPaperId: string | null;
  readonly teacherId: string | null;
  readonly createdAt: Date;
}
