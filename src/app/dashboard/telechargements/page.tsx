import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { downloadRepository } from "@/features/downloads/repositories/download.repository";

export default async function TelechargementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const downloads = await downloadRepository.findByUser(session.user.id!);

  return (
    <DashboardLayout>
      <div className="max-w-container-max mx-auto w-full">
        <div className="mb-12">
          <h2 className="font-headline-md text-primary mb-2">Mes Telechargements</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Accedez a vos epreuves et corriges telechargeables.</p>
        </div>

        {downloads.length === 0 ? (
          <div className="text-center py-20 border border-outline-variant bg-surface-container-lowest">
            <p className="font-body-lg text-on-surface-variant">Aucun telechargement pour le moment.</p>
          </div>
        ) : (
          <div className="border border-outline-variant bg-surface-container-lowest overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  {["Epreuve", "Date", "Action"].map((h) => (
                    <th key={h} className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {downloads.map((d) => (
                  <tr key={d.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-body-md text-primary">{d.orderItem.examPaper.title}</td>
                    <td className="px-6 py-4 font-body-sm text-on-surface-variant">{new Date(d.createdAt).toLocaleDateString("fr")}</td>
                    <td className="px-6 py-4">
                      <a href={`/api/download?orderItemId=${d.orderItemId}&type=paper`} className="py-2 px-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-inverse-surface transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">download</span>Telecharger
                      </a>
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
