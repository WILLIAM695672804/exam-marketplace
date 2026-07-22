/**
 * POST /api/orders/guest
 *
 * Crée une commande invité (sans authentification).
 * Body : { examPaperId, email, withCorrection }
 */

import { NextResponse } from "next/server";
import { GuestOrderRepository } from "@/features/guest-checkout/guest-order.repository";
import { serializeBigInt } from "@/lib/json";

const guestOrderRepo = new GuestOrderRepository();

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      examPaperId?: string;
      email?: string;
      withCorrection?: boolean;
    };

    // Validation basique
    if (!body.examPaperId || !body.email) {
      return NextResponse.json({ error: "examPaperId et email sont requis." }, { status: 400 });
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    const order = await guestOrderRepo.createGuestOrder({
      examPaperId: body.examPaperId,
      email: body.email.trim().toLowerCase(),
      withCorrection: body.withCorrection ?? false,
    });

    return NextResponse.json(serializeBigInt(order), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur lors de la création de la commande.",
      },
      { status: 400 }
    );
  }
}
