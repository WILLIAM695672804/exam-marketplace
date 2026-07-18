import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notchPayService } from "@/server/payments/notchpay.service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  try {
    const { orderId } = await req.json();
    const result = await notchPayService.initiatePayment(orderId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur paiement" },
      { status: 400 },
    );
  }
}
