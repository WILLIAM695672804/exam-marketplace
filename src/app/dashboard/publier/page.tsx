import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PublierContent } from "./publier-content";

export default async function PublierPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const roles: string[] = (session.user as { roles?: string[] }).roles ?? [];
  const isAdmin = roles.includes("ADMIN");

  return (
    <DashboardLayout>
      <PublierContent isAdmin={isAdmin} />
    </DashboardLayout>
  );
}
