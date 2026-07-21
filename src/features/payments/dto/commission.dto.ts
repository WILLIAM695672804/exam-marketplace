/**
 * DTOs pour les commissions.
 */

// ---------------------------------------------------------------------------
// Ventilation d'une commission
// ---------------------------------------------------------------------------

/** Détail d'une commission calculée (exposé dans les réponses admin). */
export interface CommissionBreakdown {
  readonly transactionId: string;
  readonly lines: readonly CommissionLineDto[];
  readonly platformTotal: number;
  readonly teacherTotal: number;
}

/** Ligne de commission pour un enseignant / une épreuve. */
export interface CommissionLineDto {
  readonly examPaperId: string;
  readonly teacherId: string;
  readonly itemAmount: number;
  readonly rate: number;
  readonly platformAmount: number;
  readonly teacherAmount: number;
}

// ---------------------------------------------------------------------------
// Entrée de calcul
// ---------------------------------------------------------------------------

/** Données nécessaires au calcul d'une commission. */
export interface CommissionCalculationInput {
  readonly transactionId: string;
  readonly items: readonly CommissionItemInput[];
}

export interface CommissionItemInput {
  readonly examPaperId: string;
  readonly teacherId: string;
  readonly price: number;
}
