import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProfilContent } from "./profil-content";

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <DashboardLayout>
      <ProfilContent />
    </DashboardLayout>
  );
}
