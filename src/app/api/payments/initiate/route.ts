/**
 * POST /api/payments/initiate
 *
 * Initie un paiement pour une commande.
 * Thin controller : authentification → lecture JSON → délégation au PaymentService.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PaymentService } from "@/features/payments/services/payment.service";
import { TransactionRepository } from "@/features/payments/repositories/transaction.repository";
import { PaymentOrderRepository } from "@/features/payments/repositories/order.repository";
import { ProviderFactory } from "@/features/payments/adapters/provider-factory";
import { PaymentError } from "@/features/payments/errors/payment.errors";

// ---------------------------------------------------------------------------
// Initialisation (instances partagées au niveau du module)
// ---------------------------------------------------------------------------

const transactionRepo = new TransactionRepository();
const orderRepo = new PaymentOrderRepository();

const providerFactory = new ProviderFactory({
  defaultProvider: "FAPSHI",
  fapshiPaymentMode: (process.env.FAPSHI_PAYMENT_MODE ?? "DIRECT") as "DIRECT" | "INITIATE",
  fapshi: {
    apiUser: process.env.FAPSHI_API_USER ?? "",
    apiKey: process.env.FAPSHI_API_KEY ?? "",
    webhookSecret: process.env.FAPSHI_WEBHOOK_SECRET ?? "",
  },
});

const paymentService = new PaymentService(
  transactionRepo,
  orderRepo,
  providerFactory.getDefaultProvider()
);

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // 1. Authentification
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Authentification requise." } },
      { status: 401 }
    );
  }

  // 2. Lecture du JSON
  let body: { orderId?: string; idempotencyKey?: string };
  try {
    body = (await request.json()) as { orderId?: string; idempotencyKey?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "AMOUNT_INVALID", message: "Corps de requête invalide." } },
      { status: 400 }
    );
  }

  // 3. Délégation au service
  try {
    const result = await paymentService.initiate(
      { orderId: body.orderId ?? "", idempotencyKey: body.idempotencyKey ?? "" },
      session.user.id,
      request.headers.get("x-forwarded-for") ?? undefined,
      request.headers.get("user-agent") ?? undefined
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// ---------------------------------------------------------------------------
// Gestion des erreurs
// ---------------------------------------------------------------------------

function handleError(error: unknown): NextResponse {
  if (error instanceof PaymentError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: error.code, message: error.message },
      },
      { status: error.httpStatus }
    );
  }

  console.error("[initiate] Erreur inattendue:", error);
  return NextResponse.json(
    {
      success: false,
      error: { code: "PROVIDER_ERROR", message: "Erreur interne du serveur." },
    },
    { status: 500 }
  );
}
