import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { prisma } from "@/lib/prisma";
import { approveTeacherRequest, rejectTeacherRequest } from "@/features/teacher/actions/teacher.actions";

export default async function DemandesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const roles: string[] = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN")) redirect("/dashboard");

  const requests = await prisma.teacherRequest.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      reviewer: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <DashboardLayout>
      <div className="max-w-container-max mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="font-headline-md text-primary mb-2">Demandes Enseignants</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Valider ou rejeter les demandes d&apos;accreditation des enseignants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-12">
          {[
            { label: "En attente", value: pendingCount, color: "bg-secondary-container" },
            { label: "Approuvees", value: approvedCount, color: "bg-secondary-fixed" },
            { label: "Rejetees", value: rejectedCount, color: "bg-error-container" },
          ].map((stat) => (
            <div key={stat.label} className={`border border-outline-variant p-6 flex flex-col gap-4 ${stat.color}`}>
              <span className="font-label-caps text-label-caps uppercase">{stat.label}</span>
              <div className="font-headline-lg font-headline-lg">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="border border-outline-variant bg-surface-container-lowest overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                {["Enseignant", "Email", "Statut", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-body-md text-primary">{req.user.firstName} {req.user.lastName}</td>
                  <td className="px-6 py-4 font-body-sm text-on-surface-variant">{req.user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 font-label-caps text-[10px] uppercase ${req.status === "PENDING" ? "bg-secondary-container text-on-secondary-container" : req.status === "APPROVED" ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-error-container text-on-error-container"}`}>
                      {req.status === "PENDING" ? "En attente" : req.status === "APPROVED" ? "Approuvee" : "Rejetee"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-sm text-on-surface-variant">{new Date(req.createdAt).toLocaleDateString("fr")}</td>
                  <td className="px-6 py-4">
                    {req.status === "PENDING" && (
                      <div className="flex gap-2">
                        <form action={async () => { "use server"; await approveTeacherRequest(req.id); }}>
                          <button type="submit" className="px-4 py-2 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-inverse-surface transition-colors">Approuver</button>
                        </form>
                        <form action={async (formData: FormData) => { "use server"; const reason = formData.get("reason") as string || "Non specifiee"; await rejectTeacherRequest(req.id, reason); }}>
                          <input type="hidden" name="reason" value="" />
                          <button type="submit" className="px-4 py-2 border border-error text-error font-label-caps text-label-caps uppercase hover:bg-error-container transition-colors">Rejeter</button>
                        </form>
                      </div>
                    )}
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
