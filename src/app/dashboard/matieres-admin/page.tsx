import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { prisma } from "@/lib/prisma";
import { SubjectsManager } from "./subjects-manager";

export default async function MatieresAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN")) redirect("/dashboard");

  const subjects = await prisma.subject.findMany({
    where: { deletedAt: null },
    include: { competition: true, _count: { select: { examPapers: true } } },
    orderBy: { name: "asc" },
  });
  const competitions = await prisma.competition.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <DashboardLayout>
      <SubjectsManager
        initialSubjects={JSON.parse(JSON.stringify(subjects))}
        competitions={JSON.parse(JSON.stringify(competitions))}
      />
    </DashboardLayout>
  );
}
