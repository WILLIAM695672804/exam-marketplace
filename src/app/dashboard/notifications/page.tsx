import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NotificationsContent } from "./notifications-content";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <DashboardLayout>
      <NotificationsContent />
    </DashboardLayout>
  );
}
