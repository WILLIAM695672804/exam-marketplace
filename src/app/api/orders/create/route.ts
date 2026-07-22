import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { orderRepository } from "@/features/orders/repositories/order.repository";
import { serializeBigInt } from "@/lib/json";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  try {
    const order = await orderRepository.createFromCart(session.user.id, "USER");
    return NextResponse.json(serializeBigInt(order));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur commande" },
      { status: 400 }
    );
  }
}
