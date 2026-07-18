import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { orderId } = await req.json();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Commande deja payee" }, { status: 400 });
  }

  // Simuler la transaction
  const COMMISSION_RATE = 0.15;
  const transaction = await prisma.transaction.create({
    data: {
      orderId: order.id,
      provider: "NOTCHPAY",
      reference: `sim-${Date.now()}`,
      amount: order.totalAmount,
      status: "SUCCESS",
    },
  });

  const commissionAmount = Number(order.totalAmount) * COMMISSION_RATE;
  await prisma.commission.create({
    data: {
      transactionId: transaction.id,
      rate: COMMISSION_RATE,
      platformAmount: commissionAmount,
      teacherAmount: Number(order.totalAmount) - commissionAmount,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID", paidAt: new Date() },
  });

  // Envoyer notification
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: "PAYMENT",
      channel: "IN_APP",
      subject: "Paiement confirme",
      content: `Votre commande ${order.number} a ete payee avec succes.`,
    },
  });

  return NextResponse.json({ success: true, orderId: order.id, number: order.number });
}
