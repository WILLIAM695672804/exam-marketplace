/**
 * GET /api/payments/verify?orderId=xxx
 *
 * Vérifie le statut d'un paiement (mécanisme de secours).
 * Thin controller : authentification → lecture query → délégation au PaymentService.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PaymentService } from "@/features/payments/services/payment.service";
import { TransactionRepository } from "@/features/payments/repositories/transaction.repository";
import { PaymentOrderRepository } from "@/features/payments/repositories/order.repository";
import { ProviderFactory } from "@/features/payments/adapters/provider-factory";
import { PaymentError } from "@/features/payments/errors/payment.errors";

// ---------------------------------------------------------------------------
// Initialisation
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
    baseUrl: process.env.FAPSHI_BASE_URL ?? "",
  },
});

const paymentService = new PaymentService(
  transactionRepo,
  orderRepo,
  providerFactory.getDefaultProvider()
);

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  // 1. Authentification
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Authentification requise." } },
      { status: 401 }
    );
  }

  // 2. Lecture des paramètres
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: { code: "AMOUNT_INVALID", message: "Paramètre orderId requis." } },
      { status: 400 }
    );
  }

  // 3. Délégation au service
  try {
    const result = await paymentService.verify(orderId);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ORDER_NOT_FOUND",
            message: "Aucune transaction trouvée pour cette commande.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.httpStatus }
      );
    }

    console.error("[verify] Erreur inattendue:", error);
    return NextResponse.json(
      { success: false, error: { code: "PROVIDER_ERROR", message: "Erreur interne du serveur." } },
      { status: 500 }
    );
  }
}
