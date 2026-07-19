import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function requireAdmin(session: unknown) {
  if (!session) return false;
  const roles = (session as { user?: { roles?: string[] } }).user?.roles ?? [];
  return roles.includes("ADMIN");
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });

  const { id } = await params;
  const { firstName, lastName, email, phone } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(email ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
    },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, isActive: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });

  const { id } = await params;
  const { isActive } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  });

  return NextResponse.json(user);
}
