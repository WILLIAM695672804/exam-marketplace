/**
 * Schémas Zod pour les opérations de paiement.
 *
 * Chaque schéma exporte son type inféré via z.infer<>.
 * Compatible Zod v4.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Initiation
// ---------------------------------------------------------------------------

/** Validation de la requête d'initiation de paiement. */
export const initiatePaymentSchema = z.object({
  orderId: z.string().uuid(),
  idempotencyKey: z.string().min(10).max(100),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

// ---------------------------------------------------------------------------
// Vérification
// ---------------------------------------------------------------------------

/** Validation de la requête de vérification de paiement. */
export const verifyPaymentSchema = z.object({
  orderId: z.string().uuid(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// ---------------------------------------------------------------------------
// Calcul de commission
// ---------------------------------------------------------------------------

/** Validation des entrées pour le calcul de commission. */
export const commissionCalculationSchema = z.object({
  transactionId: z.string().uuid(),
  items: z
    .array(
      z.object({
        examPaperId: z.string().uuid(),
        teacherId: z.string().uuid(),
        price: z.number().positive(),
      })
    )
    .min(1),
});

export type CommissionCalculationInput = z.infer<typeof commissionCalculationSchema>;
