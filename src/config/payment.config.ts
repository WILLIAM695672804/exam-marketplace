/**
 * Configuration du module paiement.
 *
 * Lit et valide les variables d'environnement Fapshi.
 * En développement, les placeholders "..." ne bloquent pas le serveur.
 *
 * Aucun secret n'est codé en dur — tout vient de process.env.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentModuleConfig {
  readonly provider: "FAPSHI" | "CAMPAY" | "STRIPE" | "NOTCHPAY";
  readonly fapshi: FapshiConfig;
  /** Mode de paiement Fapshi : DIRECT (mobile) ou INITIATE (URL hébergée). */
  readonly fapshiPaymentMode: "DIRECT" | "INITIATE";
  readonly appUrl: string;
  readonly environment: "sandbox" | "production";
}

export interface FapshiConfig {
  readonly apiKey: string;
  readonly apiUser: string;
  readonly baseUrl: string;
  readonly webhookSecret: string;
  readonly timeoutMs: number;
}

export interface PaymentConfigValidation {
  readonly valid: boolean;
  readonly missingVars: readonly string[];
  readonly provider: string;
  readonly environment: string;
}

// ---------------------------------------------------------------------------
// Construction (ne crashe pas — retourne un statut de validation)
// ---------------------------------------------------------------------------

function readString(key: string, fallback: string): string {
  const val = process.env[key];
  if (!val || val === "...") return fallback;
  return val;
}

function isPlaceholder(val: string): boolean {
  return val === "..." || val === "" || val.startsWith("your-");
}

function buildConfig(): PaymentModuleConfig {
  const provider = (process.env.PAYMENT_PROVIDER ?? "FAPSHI") as
    "FAPSHI" | "CAMPAY" | "STRIPE" | "NOTCHPAY";

  const environment = (process.env.PAYMENT_ENV ?? "sandbox") as "sandbox" | "production";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const defaultBaseUrl =
    environment === "production" ? "https://live.fapshi.com" : "https://sandbox.fapshi.com";

  const fapshi: FapshiConfig = {
    apiKey: process.env.FAPSHI_API_KEY ?? "",
    apiUser: readString("FAPSHI_API_USER", ""),
    baseUrl: readString("FAPSHI_BASE_URL", defaultBaseUrl),
    webhookSecret: readString("FAPSHI_WEBHOOK_SECRET", ""),
    timeoutMs: Number(process.env.FAPSHI_TIMEOUT_MS ?? 15_000),
  };

  const fapshiPaymentMode = (process.env.FAPSHI_PAYMENT_MODE ?? "DIRECT") as "DIRECT" | "INITIATE";

  return { provider, fapshi, fapshiPaymentMode, appUrl, environment };
}

// ---------------------------------------------------------------------------
// Singleton (toujours disponible, même avec des placeholders)
// ---------------------------------------------------------------------------

export const paymentConfig: PaymentModuleConfig = buildConfig();

// ---------------------------------------------------------------------------
// Validation explicite (appelée par health check et au démarrage critique)
// ---------------------------------------------------------------------------

/** Vérifie que la configuration est prête pour la production. */
export function validatePaymentConfig(): PaymentConfigValidation {
  const requiredVars = ["FAPSHI_API_USER", "FAPSHI_API_KEY", "FAPSHI_WEBHOOK_SECRET"];

  const missingVars = requiredVars.filter((v) => {
    const val = process.env[v];
    return !val || isPlaceholder(val);
  });

  return {
    valid: missingVars.length === 0,
    missingVars,
    provider: paymentConfig.provider,
    environment: paymentConfig.environment,
  };
}
