import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { prisma } from "@/lib/prisma";
import { CategoriesManager } from "./categories-manager";

export default async function CategoriesAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN")) redirect("/dashboard");

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { competitions: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <DashboardLayout>
      <CategoriesManager initialCategories={JSON.parse(JSON.stringify(categories))} />
    </DashboardLayout>
  );
}
