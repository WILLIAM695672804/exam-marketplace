/**
 * Schémas Zod pour la validation des webhooks.
 *
 * Valide le payload normalisé (après transformation par l'adapter).
 * Compatible Zod v4.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Payload normalisé
// ---------------------------------------------------------------------------

/** Validation du payload webhook normalisé. */
export const normalizedWebhookSchema = z.object({
  provider: z.enum(["FAPSHI", "NOTCHPAY", "CAMPAY", "STRIPE"]),
  providerTxId: z.string().min(1),
  providerRef: z.string().min(1),
  status: z.enum(["SUCCESS", "FAILED", "EXPIRED"]),
  amount: z.number().positive(),
  currency: z.string().length(3),
  orderReference: z.string().min(1),
  metadata: z.record(z.string(), z.string()).optional(),
  receivedAt: z.date(),
});

export type NormalizedWebhookInput = z.infer<typeof normalizedWebhookSchema>;

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

/** Validation des données de vérification de signature. */
export const webhookSignatureSchema = z.object({
  payload: z.unknown(),
  signature: z.string().min(1),
  secret: z.string().min(1),
});

export type WebhookSignatureInput = z.infer<typeof webhookSignatureSchema>;

// ---------------------------------------------------------------------------
// Payload brut entrant
// ---------------------------------------------------------------------------

/** Validation du payload brut reçu avant transformation par l'adapter. */
export const rawWebhookSchema = z.object({
  rawBody: z.unknown(),
  signature: z.string().min(1),
  remoteIp: z.string(),
  provider: z.enum(["FAPSHI", "NOTCHPAY", "CAMPAY", "STRIPE"]),
});

export type RawWebhookInput = z.infer<typeof rawWebhookSchema>;
