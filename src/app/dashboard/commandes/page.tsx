import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CommandesContent } from "./commandes-content";

export default async function CommandesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <DashboardLayout>
      <CommandesContent />
    </DashboardLayout>
  );
}
