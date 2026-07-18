"use server";

import { auth } from "@/lib/auth";
import { requireRole } from "@/server/permissions/guard";
import { orderRepository } from "../repositories/order.repository";

export async function createOrderFromCart() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");
  const order = await orderRepository.createFromCart(session.user.id);
  return order;
}

export async function getMyOrders(status?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");
  return orderRepository.findByUser(session.user.id, status);
}

export async function getAllOrders(status?: string) {
  await requireRole("ADMIN");
  const { prisma } = await import("@/lib/prisma");
  return prisma.order.findMany({
    where: { ...(status ? { status: status as "PENDING" | "PAID" | "CANCELLED" } : {}) },
    include: {
      items: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      transactions: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
