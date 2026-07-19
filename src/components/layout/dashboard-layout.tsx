import Link from "next/link";
import { auth } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardMobileMenu } from "@/components/layout/dashboard-mobile-menu";

interface SidebarLink {
  label: string;
  href: string;
  roles?: string[];
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "Profil", href: "/dashboard/profil" },
  { label: "Commandes", href: "/dashboard/commandes", roles: ["BUYER"] },
  {
    label: "Telechargements",
    href: "/dashboard/telechargements",
    roles: ["BUYER"],
  },
  { label: "Panier", href: "/dashboard/panier", roles: ["BUYER"] },
  { label: "Mes epreuves", href: "/dashboard/mes-epreuves", roles: ["TEACHER"] },
  { label: "Publier une epreuve", href: "/dashboard/publier", roles: ["TEACHER"] },
  { label: "Demandes enseignant", href: "/dashboard/demandes", roles: ["ADMIN"] },
  { label: "Utilisateurs", href: "/dashboard/utilisateurs", roles: ["ADMIN"] },
  { label: "Categories", href: "/dashboard/categories", roles: ["ADMIN"] },
  { label: "Concours", href: "/dashboard/concours-admin", roles: ["ADMIN"] },
  { label: "Matieres", href: "/dashboard/matieres-admin", roles: ["ADMIN"] },
  { label: "Statistiques", href: "/dashboard/statistiques", roles: ["ADMIN", "TEACHER"] },
  { label: "Parametres", href: "/dashboard/parametres" },
  { label: "Notifications", href: "/dashboard/notifications" },
];

export async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion");
  }

  const userRoles: string[] = (session.user as { roles?: string[] }).roles ?? ["BUYER"];

  const filteredLinks = SIDEBAR_LINKS.filter(
    (link) => !link.roles || link.roles.some((r) => userRoles.includes(r))
  );

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex justify-between items-center max-w-full mx-auto px-margin-mobile md:px-margin-desktop h-16">
          <Link
            href="/dashboard"
            className="font-headline-sm text-headline-sm italic shrink-0"
            style={{ fontFamily: "Libre Caslon Text" }}
          >
            ExamMarket
          </Link>

          {/* Desktop: email + logout */}
          <div className="hidden md:flex items-center gap-4">
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[240px]">
              {session.user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
              >
                Deconnexion
              </button>
            </form>
          </div>

          {/* Mobile: hamburger */}
          <DashboardMobileMenu
            userEmail={session.user.email ?? ""}
            userRoles={userRoles}
            sidebarLinks={filteredLinks}
          />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 min-h-[calc(100vh-4rem)] border-r border-outline-variant/30 bg-surface-container-lowest p-6 gap-1">
          <nav className="flex flex-col gap-0.5">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-margin-mobile md:p-8">{children}</main>
      </div>
    </div>
  );
}
