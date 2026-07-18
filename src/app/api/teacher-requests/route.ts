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

  const requests = await prisma.teacherRequest.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      reviewer: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}
