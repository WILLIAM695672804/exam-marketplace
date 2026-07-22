/**
 * POST /api/payments/webhook/fapshi
 *
 * Réception des webhooks Fapshi.
 * Thin controller : body brut → signature → délégation au WebhookService.
 * Après traitement réussi : envoie l'email de confirmation.
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
import { mailService } from "@/server/emails/mail.service";
import { GuestCheckoutService } from "@/features/guest-checkout/guest-checkout.service";
import { GuestOrderRepository } from "@/features/guest-checkout/guest-order.repository";
import { PaymentService } from "@/features/payments/services/payment.service";

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

const transactionRepo = new TransactionRepository();
const orderRepo = new PaymentOrderRepository();
const commissionRepo = new CommissionRepository();
const guestOrderRepo = new GuestOrderRepository();

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

const commissionService = new CommissionService(commissionRepo, orderRepo);

const guestCheckoutService = new GuestCheckoutService(guestOrderRepo, paymentService);

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
  const signature = request.headers.get("x-fapshi-signature") ?? "";

  // 3. Récupérer l'IP émettrice
  const remoteIp =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";

  // 4. Délégation au service
  try {
    const result = await webhookService.process(rawBody, signature, remoteIp);

    // 5. Après traitement réussi → envoyer l'email de confirmation
    if (result.processed && result.orderStatus === "PAID" && result.orderId) {
      try {
        const order = await guestOrderRepo.findById(result.orderId);
        if (order) {
          if (order.ownerType === "GUEST" && order.guestEmail) {
            // Générer les liens de téléchargement pour l'invité
            const downloadLinks = await guestCheckoutService.generateDownloadLinks(order);
            await mailService.sendGuestOrderConfirmation(
              order.guestEmail,
              {
                number: order.number,
                totalAmount: Number(order.totalAmount),
                items: order.items.map((item) => ({
                  titleSnapshot: item.titleSnapshot,
                  yearSnapshot: item.yearSnapshot,
                  price: Number(item.price),
                })),
              },
              downloadLinks
            );
          } else {
            // Utilisateur connecté
            await mailService.sendOrderConfirmation(result.orderId);
          }
        }
      } catch (emailError) {
        console.error("[webhook] Erreur envoi email confirmation:", emailError);
        // Ne pas faire échouer le webhook pour une erreur d'email
      }
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof PaymentError) {
      console.error(`[webhook] Erreur traitée: ${error.code} — ${error.message}`);
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
