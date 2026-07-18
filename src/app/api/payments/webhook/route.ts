import { NextResponse } from "next/server";
import { notchPayService } from "@/server/payments/notchpay.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await notchPayService.handleWebhook(body);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur webhook" },
      { status: 500 },
    );
  }
}
