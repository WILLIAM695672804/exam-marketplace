import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { StatsDownloads } from "./stats-downloads";

export default async function StatistiquesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const roles: string[] = (session.user as { roles?: string[] }).roles ?? [];
  // Admin et enseignant peuvent voir les stats (admin: tout, enseignant: ses epreuves)
  if (!roles.includes("ADMIN") && !roles.includes("TEACHER")) redirect("/dashboard");

  const [totalUsers, totalExams, totalOrders, revenue, totalDownloads] = await Promise.all([
    prisma.user.count(),
    prisma.examPaper.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.transaction.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.download.count(),
  ]);

  const recentTransactions = await prisma.transaction.findMany({
    include: { order: { select: { number: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <DashboardLayout>
      <div className="max-w-container-max mx-auto w-full">
        <div className="mb-12">
          <h2 className="font-headline-md text-primary mb-2">Statistiques</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Apercu des performances et des metriques de la plateforme.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gutter mb-12">
          {[
            { label: "Utilisateurs", value: totalUsers },
            { label: "Epreuves", value: totalExams },
            { label: "Commandes", value: totalOrders },
            { label: "Revenu", value: formatPrice(revenue._sum.amount ?? 0) },
            { label: "Telechargements", value: totalDownloads },
          ].map((stat) => (
            <div
              key={stat.label}
              className="border border-outline-variant bg-surface p-6 flex flex-col gap-4"
            >
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                {stat.label}
              </span>
              <div className="font-headline-lg font-headline-lg">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Statistiques de telechargement par epreuve avec periodes */}
        <div className="mb-12">
          <StatsDownloads />
        </div>

        <div className="border border-outline-variant bg-surface-container-lowest overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                {["ID", "Commande", "Montant", "Statut", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((trx) => (
                <tr
                  key={trx.id}
                  className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors"
                >
                  <td className="px-6 py-4 font-body-md text-primary font-mono text-sm">
                    {trx.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 font-body-sm text-on-surface-variant">
                    {trx.order?.number ?? "N/A"}
                  </td>
                  <td className="px-6 py-4 font-body-md text-primary">
                    {formatPrice(trx.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 font-label-caps text-[10px] uppercase ${trx.status === "SUCCESS" ? "bg-secondary-fixed text-on-secondary-fixed" : trx.status === "FAILED" ? "bg-error-container text-on-error-container" : "bg-surface-container text-on-surface-variant"}`}
                    >
                      {trx.status === "SUCCESS"
                        ? "Reussie"
                        : trx.status === "FAILED"
                          ? "Echouee"
                          : trx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-sm text-on-surface-variant">
                    {new Date(trx.createdAt).toLocaleDateString("fr")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
