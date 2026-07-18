import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { prisma } from "@/lib/prisma";
import { UsersManager } from "./users-manager";

export default async function UtilisateursPage() {
  const session = await auth();
  if (!session?.user) return null;

  const roles: string[] = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN")) redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      phone: true,
      createdAt: true,
      userRoles: { include: { role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const allRoles = await prisma.role.findMany();
  const total = await prisma.user.count();
  const buyerCount = await prisma.userRoleOnRole.count({ where: { role: { name: "BUYER" } } });
  const teacherCount = await prisma.userRoleOnRole.count({ where: { role: { name: "TEACHER" } } });
  const adminCount = await prisma.userRoleOnRole.count({ where: { role: { name: "ADMIN" } } });

  return (
    <DashboardLayout>
      <UsersManager
        initialUsers={JSON.parse(JSON.stringify(users))}
        allRoles={JSON.parse(JSON.stringify(allRoles))}
        total={total}
        buyerCount={buyerCount}
        teacherCount={teacherCount}
        adminCount={adminCount}
      />
    </DashboardLayout>
  );
}
