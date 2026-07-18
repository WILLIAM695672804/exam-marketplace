import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const userRoles: string[] = (session.user as { roles?: string[] }).roles ?? [];
  if (!userRoles.includes("ADMIN")) {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  const [totalUsers, totalExams, totalOrders, totalRevenue, pendingRequests] = await Promise.all([
    prisma.user.count(),
    prisma.examPaper.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.transaction.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.teacherRequest.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalExams,
    totalOrders,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    pendingTeacherRequests: pendingRequests,
  });
}
