import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { examRepository } from "@/features/exams/repositories/exam.repository";
import { formatPrice } from "@/lib/utils";

export default async function MesEpreuvesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { items: exams } = await examRepository.findAll({
    authorId: session.user.id!,
    limit: 50,
    status: "ALL",
  });

  return (
    <DashboardLayout>
      <div className="max-w-container-max mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="font-headline-md text-primary mb-2">Mes Epreuves</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Gerer vos epreuves publiees, suivre les ventes et les performances.
            </p>
          </div>
          <Link
            href="/dashboard/publier"
            className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-3 px-6 hover:bg-inverse-surface transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>Nouvelle epreuve
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-20 border border-outline-variant bg-surface-container-lowest">
            <p className="font-body-lg text-on-surface-variant mb-4">
              Vous n&apos;avez pas encore publie d&apos;epreuve.
            </p>
            <Link
              href="/dashboard/publier"
              className="font-label-caps text-label-caps text-primary hover:text-secondary underline"
            >
              Publier votre premiere epreuve
            </Link>
          </div>
        ) : (
          <div className="border border-outline-variant bg-surface-container-lowest overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">
                    Titre
                  </th>
                  <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">
                    Statut
                  </th>
                  <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">
                    Prix
                  </th>
                  <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">
                    Ventes
                  </th>
                  <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-6 py-4 font-body-md text-primary">{exam.title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 font-label-caps text-[10px] uppercase ${exam.status === "PUBLISHED" ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container text-on-surface-variant"}`}
                      >
                        {exam.status === "PUBLISHED"
                          ? "Publiee"
                          : exam.status === "DRAFT"
                            ? "Brouillon"
                            : "Masquee"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-body-sm text-on-surface-variant">
                      {formatPrice(exam.price)}
                    </td>
                    <td className="px-6 py-4 font-body-sm text-on-surface-variant">
                      {exam._count.orderItems}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-surface-container transition-colors">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                            edit
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
