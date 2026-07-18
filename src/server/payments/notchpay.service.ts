import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface NotchPayResponse {
  transaction_id: string;
  redirect_url: string;
  status: string;
}

interface NotchPayWebhook {
  transaction_id: string;
  status: "SUCCESS" | "FAILED" | "EXPIRED";
  reference: string;
  amount: number;
  metadata?: Record<string, string>;
}

const NOTCHPAY_API_URL = "https://api.notchpay.co/v1/payments";
const COMMISSION_RATE = 0.15;

export const notchPayService = {
  async initiatePayment(orderId: string): Promise<NotchPayResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });

    if (!order) throw new Error("Commande introuvable");
    if (order.status !== "PENDING") throw new Error("Cette commande a deja ete payee");

    const apiKey = process.env.NOTCHPAY_API_KEY;
    if (!apiKey) throw new Error("Configuration NotchPay manquante");

    const payload = {
      amount: Number(order.totalAmount),
      currency: "XAF",
      reference: order.number,
      email: order.user.email,
      metadata: { orderId: order.id },
    };

    logger.info({ orderId, reference: order.number }, "Initiation paiement NotchPay");

    if (process.env.NODE_ENV === "development") {
      return {
        transaction_id: `sandbox-${Date.now()}`,
        redirect_url: `/api/payments/simulate?orderId=${order.id}`,
        status: "PENDING",
      } as NotchPayResponse;
    }

    const response = await fetch(NOTCHPAY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "Erreur API NotchPay");
      throw new Error("Erreur lors de l'initiation du paiement");
    }

    return response.json();
  },

  async handleWebhook(body: NotchPayWebhook): Promise<void> {
    logger.info({ body }, "Webhook NotchPay recu");

    const order = await prisma.order.findUnique({
      where: { number: body.reference },
      include: { items: true },
    });

    if (!order) {
      logger.error({ reference: body.reference }, "Commande introuvable pour webhook");
      return;
    }

    const transactionStatus = body.status === "SUCCESS" ? "SUCCESS" : body.status === "EXPIRED" ? "EXPIRED" : "FAILED";

    await prisma.transaction.create({
      data: {
        orderId: order.id,
        provider: "NOTCHPAY",
        reference: body.transaction_id,
        amount: body.amount,
        status: transactionStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbackData: body as any,
      },
    });

    if (body.status === "SUCCESS") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      // Calculer et enregistrer la commission
      const commissionAmount = Number(order.totalAmount) * COMMISSION_RATE;

      const transaction = await prisma.transaction.findFirst({
        where: { reference: body.transaction_id },
      });

      if (transaction) {
        await prisma.commission.create({
          data: {
            transactionId: transaction.id,
            rate: COMMISSION_RATE,
            platformAmount: commissionAmount,
            teacherAmount: Number(order.totalAmount) - commissionAmount,
          },
        });
      }

      logger.info({ orderId: order.id, commissionAmount }, "Paiement reussi, commission calculee");
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: body.status === "EXPIRED" ? "EXPIRED" : "CANCELLED" },
      });
    }
  },
};
