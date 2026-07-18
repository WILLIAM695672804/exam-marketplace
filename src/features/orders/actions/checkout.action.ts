"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { orderRepository } from "../repositories/order.repository";
import { notchPayService } from "@/server/payments/notchpay.service";

export async function checkoutAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");

  const order = await orderRepository.createFromCart(session.user.id);

  const payment = await notchPayService.initiatePayment(order.id);

  if (payment.redirect_url) {
    redirect(payment.redirect_url);
  }

  redirect("/dashboard/commandes");
}
