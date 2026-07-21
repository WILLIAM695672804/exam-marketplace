/**
 * GET /api/payments/health
 *
 * Vérifie que le module paiement est correctement configuré.
 * Utilisé pour le monitoring et les health checks de déploiement.
 *
 * Ne renvoie JAMAIS de secrets (API key, webhook secret, etc.).
 */

import { NextResponse } from "next/server";
import { validatePaymentConfig, paymentConfig } from "@/config/payment.config";
import { ProviderFactory } from "@/features/payments/adapters/provider-factory";

export async function GET() {
  const validation = validatePaymentConfig();

  if (!validation.valid) {
    return NextResponse.json(
      {
        status: "degraded",
        reason: "Configuration incomplète",
        missingVars: validation.missingVars,
        hint: "Voir .env.example pour la liste complète des variables requises.",
        provider: validation.provider,
        environment: validation.environment,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  try {
    // Vérifier que le provider peut être instancié
    const factory = new ProviderFactory({
      defaultProvider: paymentConfig.provider,
      fapshiPaymentMode: paymentConfig.fapshiPaymentMode,
      fapshi: {
        apiUser: process.env.FAPSHI_API_USER ?? "",
        apiKey: paymentConfig.fapshi.apiKey,
        webhookSecret: paymentConfig.fapshi.webhookSecret,
        baseUrl: paymentConfig.fapshi.baseUrl,
        timeoutMs: paymentConfig.fapshi.timeoutMs,
      },
    });

    const provider = factory.getDefaultProvider();

    return NextResponse.json(
      {
        status: "ok",
        provider: paymentConfig.provider,
        environment: paymentConfig.environment,
        providerName: provider.providerName,
        appUrl: paymentConfig.appUrl,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[health] Échec du health check paiement :", error);

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Configuration paiement invalide",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
