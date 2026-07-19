import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function requireAdmin(session: unknown) {
  if (!session) return false;
  const roles = (session as { user?: { roles?: string[] } }).user?.roles ?? [];
  return roles.includes("ADMIN");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  const { id } = await params;
  const { roleId } = await req.json();

  await prisma.userRoleOnRole.upsert({
    where: { userId_roleId: { userId: id, roleId } },
    update: {},
    create: { userId: id, roleId },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  const { id } = await params;
  const { roleId } = await req.json();

  await prisma.userRoleOnRole.deleteMany({
    where: { userId: id, roleId },
  });

  return NextResponse.json({ success: true });
}
