import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PublierContent } from "./publier-content";

export default async function PublierPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <DashboardLayout>
      <PublierContent />
    </DashboardLayout>
  );
}
