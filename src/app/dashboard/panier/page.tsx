import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PanierContent } from "./panier-content";

export default async function PanierPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <DashboardLayout>
      <PanierContent />
    </DashboardLayout>
  );
}
