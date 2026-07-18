import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const roles: string[] = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      userRoles: { include: { role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(users);
}
