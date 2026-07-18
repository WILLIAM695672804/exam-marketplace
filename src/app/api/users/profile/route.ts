import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { firstName, lastName, phone } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...(firstName ? { firstName } : {}), ...(lastName ? { lastName } : {}), ...(phone !== undefined ? { phone } : {}) },
  });

  return NextResponse.json({ success: true });
}
