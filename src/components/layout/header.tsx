import Link from "next/link";
import { auth } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/mobile-menu";

const NAV_LINKS = [
  { label: "Catalogue", href: "/catalogue" },
  { label: "Categories", href: "/categories" },
  { label: "Matieres", href: "/matieres" },
  { label: "FAQ", href: "/faq" },
];

export async function Header() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <header className="fixed top-0 z-50 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
      <div className="flex justify-between items-center max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-20">
        {/* Brand */}
        <Link
          href="/"
          className="font-headline-sm text-headline-sm italic tracking-tight shrink-0"
          style={{ fontFamily: "Libre Caslon Text" }}
        >
          ExamMarket
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors px-3 py-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions - desktop */}
        <div className="hidden md:flex items-center gap-6">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="font-label-caps text-label-caps"
                >
                  Deconnexion
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors underline decoration-secondary-fixed/0 hover:decoration-secondary/50 underline-offset-4"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="font-label-caps text-label-caps bg-primary text-on-primary px-6 py-2 hover:bg-inverse-surface transition-colors"
              >
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* Menu mobile */}
        <MobileMenu isLoggedIn={isLoggedIn} />
      </div>
    </header>
  );
}
