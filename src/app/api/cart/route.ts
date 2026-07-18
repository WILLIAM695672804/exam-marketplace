import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cartRepository } from "@/features/cart/repositories/cart.repository";
import { serializeBigInt } from "@/lib/json";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  const items = await cartRepository.findByUser(session.user.id);
  const count = await cartRepository.count(session.user.id);
  return NextResponse.json(serializeBigInt({ items, count }));
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  const { examPaperId, withCorrection } = await req.json();
  await cartRepository.update(session.user.id, examPaperId, withCorrection);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  const { examPaperId } = await req.json();
  await cartRepository.remove(session.user.id, examPaperId);
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  const { examPaperId, withCorrection } = await req.json();
  await cartRepository.add(session.user.id, examPaperId, withCorrection ?? false);
  return NextResponse.json({ success: true });
}
