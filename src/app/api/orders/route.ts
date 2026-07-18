import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { orderRepository } from "@/features/orders/repositories/order.repository";
import { serializeBigInt } from "@/lib/json";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const orders = await orderRepository.findByUser(session.user.id);
  return NextResponse.json(serializeBigInt(orders));
}
