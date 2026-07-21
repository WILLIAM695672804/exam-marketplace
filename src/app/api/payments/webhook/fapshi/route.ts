/**
 * POST /api/payments/webhook/fapshi
 *
 * Réception des webhooks Fapshi.
 * Thin controller : body brut → signature → délégation au WebhookService.
 *
 * CRITIQUE : le body est lu en texte brut (request.text()) pour permettre
 * la vérification HMAC. Ne JAMAIS parser le JSON avant l'envoi au service.
 */

import { NextResponse } from "next/server";
import { WebhookService } from "@/features/payments/services/webhook.service";
import { CommissionService } from "@/features/payments/services/commission.service";
import { TransactionRepository } from "@/features/payments/repositories/transaction.repository";
import { PaymentOrderRepository } from "@/features/payments/repositories/order.repository";
import { CommissionRepository } from "@/features/payments/repositories/commission.repository";
import { ProviderFactory } from "@/features/payments/adapters/provider-factory";
import { PaymentError } from "@/features/payments/errors/payment.errors";

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

const transactionRepo = new TransactionRepository();
const orderRepo = new PaymentOrderRepository();
const commissionRepo = new CommissionRepository();

const providerFactory = new ProviderFactory({
  defaultProvider: "FAPSHI",
    fapshiPaymentMode: (process.env.FAPSHI_PAYMENT_MODE ?? "DIRECT") as "DIRECT" | "INITIATE",
  fapshi: {
    apiUser: process.env.FAPSHI_API_USER ?? "",
    apiKey: process.env.FAPSHI_API_KEY ?? "",
    webhookSecret: process.env.FAPSHI_WEBHOOK_SECRET ?? "",
  },
});

const commissionService = new CommissionService(
  commissionRepo,
  orderRepo
);

const webhookService = new WebhookService(
  transactionRepo,
  orderRepo,
  providerFactory.getDefaultProvider(),
  commissionService
);

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // 1. Lire le body BRUT (ne pas parser — HMAC en a besoin)
  const rawBody = await request.text();

  // 2. Récupérer la signature (header Fapshi)
  const signature =
    request.headers.get("x-fapshi-signature") ?? "";

  // 3. Récupérer l'IP émettrice
  const remoteIp =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // 4. Délégation au service
  try {
    const result = await webhookService.process(
      rawBody,
      signature,
      remoteIp
    );

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof PaymentError) {
      // Même en cas d'erreur, on répond 200 à Fapshi pour éviter
      // qu'il ne renvoie le webhook indéfiniment.
      // L'erreur est journalisée côté service.
      console.error(
        `[webhook] Erreur traitée: ${error.code} — ${error.message}`
      );
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 200 }
      );
    }

    console.error("[webhook] Erreur inattendue:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "PROVIDER_ERROR", message: "Erreur interne." },
      },
      { status: 200 }
    );
  }
}
