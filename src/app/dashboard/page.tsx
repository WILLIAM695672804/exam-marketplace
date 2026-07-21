import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { cartRepository } from "@/features/cart/repositories/cart.repository";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const userId = session.user.id!;
  const roles: string[] = (session.user as { roles?: string[] }).roles ?? [];

  const [
    cartCount,
    ordersCount,
    downloadsCount,
    revenueTotal,
    recentOrders,
    recentExams,
    teacherExamCount,
    teacherSalesCount,
    teacherRevenue,
  ] = await Promise.all([
    cartRepository.count(userId),
    roles.includes("ADMIN") ? prisma.order.count() : prisma.order.count({ where: { userId } }),
    roles.includes("ADMIN")
      ? prisma.download.count()
      : prisma.download.count({ where: { userId } }),
    roles.includes("ADMIN")
      ? prisma.transaction.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } })
      : Promise.resolve({ _sum: { amount: 0 } }),
    prisma.order.findMany({
      where: roles.includes("ADMIN") ? {} : { userId },
      include: {
        items: { include: { examPaper: { select: { title: true } } } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    roles.includes("TEACHER") || roles.includes("ADMIN")
      ? prisma.examPaper.findMany({
          where: { authorId: userId, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { _count: { select: { orderItems: true } } },
        })
      : Promise.resolve([]),
    prisma.examPaper.count({ where: { authorId: userId, deletedAt: null } }),
    prisma.orderItem.count({ where: { examPaper: { authorId: userId } } }),
    prisma.transaction.aggregate({
      where: { status: "SUCCESS", order: { items: { some: { examPaper: { authorId: userId } } } } },
      _sum: { amount: true },
    }),
  ]);

  const isTeacher = roles.includes("TEACHER") || roles.includes("ADMIN");

  const stats = [
    { label: "Panier", value: cartCount, icon: "shopping_cart", metric: "Metrique Acheteur" },
    { label: "Commandes", value: ordersCount, icon: "receipt_long", metric: "Metrique Acheteur" },
    ...(isTeacher
      ? [
          {
            label: "Mes epreuves",
            value: teacherExamCount,
            icon: "library_books",
            metric: "Metrique Enseignant",
          },
          {
            label: "Ventes",
            value: teacherSalesCount,
            icon: "shopping_bag",
            metric: "Metrique Enseignant",
          },
          {
            label: "Revenu",
            value: formatPrice(teacherRevenue._sum.amount ?? 0),
            icon: "attach_money",
            metric: "Metrique Enseignant",
          },
        ]
      : []),
    ...(roles.includes("ADMIN")
      ? [
          {
            label: "Revenu Plateforme",
            value: formatPrice(revenueTotal._sum.amount ?? 0),
            icon: "payments",
            metric: "Metrique Admin",
          },
        ]
      : []),
    {
      label: "Telechargements",
      value: downloadsCount,
      icon: "download",
      metric: "Metrique Acheteur",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-container-max mx-auto flex flex-col gap-section-gap">
        <section>
          <h1 className="text-display-lg font-display-lg mb-2">
            Bon retour, {session.user.name?.split(" ")[0] || "Utilisateur"}
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
            Voici un apercu de votre activite sur la plateforme et de vos indicateurs de
            performance.
          </p>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="border border-outline-variant bg-surface p-6 flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <span className="text-label-caps font-label-caps text-on-surface-variant uppercase">
                    {stat.label}
                  </span>
                  <span className="material-symbols-outlined text-outline">{stat.icon}</span>
                </div>
                <div className="text-headline-lg font-headline-lg">{stat.value}</div>
                <div className="text-label-caps font-label-caps text-on-surface-variant pt-2 border-t border-surface-container-highest">
                  {stat.metric}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex justify-between items-end border-b border-outline-variant pb-4">
              <h2 className="text-headline-md font-headline-md">Activite Recente</h2>
              <Link
                href="/dashboard/commandes"
                className="text-label-caps font-label-caps uppercase hover:underline decoration-secondary underline-offset-4"
              >
                Voir tout
              </Link>
            </div>
            <div className="flex flex-col">
              {recentOrders.length === 0 && recentExams.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-body-md text-on-surface-variant mb-4">
                    Aucune activite recente.
                  </p>
                  {isTeacher && (
                    <Link
                      href="/dashboard/publier"
                      className="text-label-caps text-label-caps text-primary hover:text-secondary underline"
                    >
                      Publier votre premiere epreuve
                    </Link>
                  )}
                  {!isTeacher && (
                    <Link
                      href="/catalogue"
                      className="text-label-caps text-label-caps text-primary hover:text-secondary underline"
                    >
                      Explorer le catalogue
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {recentExams.map((exam) => (
                    <div
                      key={`exam-${exam.id}`}
                      className="flex items-center justify-between py-6 border-b border-surface-container-highest"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-container-low flex items-center justify-center border border-outline-variant">
                          <span className="material-symbols-outlined text-on-surface-variant">
                            publish
                          </span>
                        </div>
                        <div>
                          <div className="text-body-md font-body-md font-bold">{exam.title}</div>
                          <div className="text-body-sm text-on-surface-variant">
                            Epreuve publiee — {exam._count.orderItems} vente
                            {exam._count.orderItems > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-label-caps font-label-caps uppercase border border-outline-variant ${exam.status === "PUBLISHED" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"}`}
                      >
                        {exam.status === "PUBLISHED" ? "Publiee" : "Brouillon"}
                      </span>
                    </div>
                  ))}
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-6 border-b border-surface-container-highest"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-container-low flex items-center justify-center border border-outline-variant">
                          <span className="material-symbols-outlined text-on-surface-variant">
                            {order.status === "PAID" ? "shopping_bag" : "receipt_long"}
                          </span>
                        </div>
                        <div>
                          <div className="text-body-md font-body-md font-bold">{order.number}</div>
                          <div className="text-body-sm font-body-sm text-on-surface-variant">
                            {roles.includes("ADMIN") && order.user
                              ? `${order.user.firstName} ${order.user.lastName} — `
                              : ""}
                            {order.items.length} epreuve{order.items.length > 1 ? "s" : ""} — {formatPrice(order.totalAmount)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-body-md font-body-md">
                          {formatPrice(order.totalAmount)}
                        </span>
                        <span
                          className={`px-2 py-1 text-label-caps font-label-caps uppercase border border-outline-variant ${order.status === "PAID" ? "bg-secondary-fixed text-on-secondary-fixed" : order.status === "PENDING" ? "bg-surface-container text-on-surface-variant" : "bg-error-container text-on-error-container"}`}
                        >
                          {order.status === "PAID"
                            ? "Payee"
                            : order.status === "PENDING"
                              ? "En attente"
                              : "Annulee"}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant p-8 sticky top-28">
            <h3 className="text-headline-sm font-headline-sm mb-6 border-b border-outline-variant pb-4">
              Actions Rapides
            </h3>
            <div className="flex flex-col gap-4">
              {roles.includes("TEACHER") || roles.includes("ADMIN") ? (
                <Link
                  href="/dashboard/publier"
                  className="bg-primary text-on-primary w-full py-4 px-6 flex justify-between items-center group transition-colors hover:bg-inverse-surface"
                >
                  <span className="text-label-caps font-label-caps uppercase">
                    Publier une epreuve
                  </span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              ) : null}
              <Link
                href="/catalogue"
                className="bg-transparent text-primary border border-primary w-full py-4 px-6 flex justify-between items-center group transition-colors hover:bg-surface-container-low"
              >
                <span className="text-label-caps font-label-caps uppercase">
                  Parcourir le catalogue
                </span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
              {roles.includes("ADMIN") && (
                <Link
                  href="/dashboard/statistiques"
                  className="bg-transparent text-primary border border-primary w-full py-4 px-6 flex justify-between items-center group transition-colors hover:bg-surface-container-low"
                >
                  <span className="text-label-caps font-label-caps uppercase">
                    Voir les rapports
                  </span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="h-24" />
      </div>
    </DashboardLayout>
  );
}
