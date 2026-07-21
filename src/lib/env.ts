import { z } from "zod";

const envSchema = z.object({
  // Base de données
  DATABASE_URL: z.string().url(),

  // Auth.js
  AUTH_SECRET: z.string().min(1),

  // Emails
  RESEND_API_KEY: z.string().optional(),

  // NotchPay (déprécié)
  NOTCHPAY_API_KEY: z.string().optional(),
  NOTCHPAY_API_SECRET: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Upload
  UPLOAD_DIR: z.string().default("uploads"),

  // Environnement
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Module Paiement — Fapshi Direct Pay
  PAYMENT_PROVIDER: z.enum(["FAPSHI", "CAMPAY", "STRIPE", "NOTCHPAY"]).default("FAPSHI"),
  PAYMENT_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  FAPSHI_API_USER: z.string().optional(),
  FAPSHI_API_KEY: z.string().optional(),
  FAPSHI_WEBHOOK_SECRET: z.string().optional(),
  FAPSHI_BASE_URL: z.string().url().default("https://api.fapshi.com/v1"),
  FAPSHI_TIMEOUT_MS: z.coerce.number().positive().default(15_000),
});

export const env = envSchema.parse(process.env);
