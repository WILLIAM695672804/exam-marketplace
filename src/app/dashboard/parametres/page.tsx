import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ParametresContent } from "./parametres-content";

export default async function ParametresPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <DashboardLayout>
      <ParametresContent />
    </DashboardLayout>
  );
}
