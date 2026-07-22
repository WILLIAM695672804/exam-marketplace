/**
 * POST /api/payments/initiate
 *
 * Initie un paiement pour une commande (utilisateur connecté OU invité).
 * Thin controller : session optionnelle → lecture JSON → délégation au PaymentService.
 *
 * L'authentification est optionnelle :
 * - Si connecté + ownerType USER → guard de propriété
 * - Si invité + ownerType GUEST → continuer sans session
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PaymentService } from "@/features/payments/services/payment.service";
import { TransactionRepository } from "@/features/payments/repositories/transaction.repository";
import { PaymentOrderRepository } from "@/features/payments/repositories/order.repository";
import { ProviderFactory } from "@/features/payments/adapters/provider-factory";
import { PaymentError } from "@/features/payments/errors/payment.errors";
import type { PaymentCustomer } from "@/features/payments/types/payment-customer";

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
    baseUrl: process.env.FAPSHI_BASE_URL ?? "",
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
  // 1. Session optionnelle — pas de return 401
  const session = await auth();

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

  // 3. Récupérer la commande pour déterminer l'ownerType
  const order = await orderRepo.findById(body.orderId ?? "");
  if (!order) {
    return NextResponse.json(
      { success: false, error: { code: "ORDER_NOT_FOUND", message: "Commande introuvable." } },
      { status: 404 }
    );
  }

  // 4. Construire le PaymentCustomer selon l'ownerType
  let customer: PaymentCustomer;

  if (order.ownerType === "USER") {
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "AUTH_REQUIRED", message: "Connectez-vous pour payer cette commande." },
        },
        { status: 401 }
      );
    }

    customer = {
      ownerType: "USER",
      email: order.user?.email ?? "",
      phone: order.user?.phone ?? null,
      name:
        order.user?.firstName && order.user?.lastName
          ? `${order.user.firstName} ${order.user.lastName}`
          : undefined,
      userId: session.user.id,
    };
  } else {
    // GUEST
    if (!order.guestEmail) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "ORDER_NOT_FOUND", message: "Commande invalide (email manquant)." },
        },
        { status: 400 }
      );
    }

    customer = {
      ownerType: "GUEST",
      email: order.guestEmail,
    };
  }

  // 5. Délégation au service
  try {
    const result = await paymentService.initiate(
      { orderId: body.orderId ?? "", idempotencyKey: body.idempotencyKey ?? "" },
      customer,
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
