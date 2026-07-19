import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { prisma } from "@/lib/prisma";
import { CompetitionsManager } from "./competitions-manager";

export default async function ConcoursAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN")) redirect("/dashboard");

  const competitions = await prisma.competition.findMany({
    where: { deletedAt: null },
    include: { category: true, _count: { select: { subjects: true, examPapers: true } } },
    orderBy: { name: "asc" },
  });
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <DashboardLayout>
      <CompetitionsManager
        initialCompetitions={JSON.parse(JSON.stringify(competitions))}
        categories={JSON.parse(JSON.stringify(categories))}
      />
    </DashboardLayout>
  );
}
