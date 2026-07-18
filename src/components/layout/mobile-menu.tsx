"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileMenuProps {
  isLoggedIn: boolean;
}

const NAV_LINKS = [
  { label: "Catalogue", href: "/catalogue" },
  { label: "Categories", href: "/categories" },
  { label: "Concours", href: "/concours" },
  { label: "Matieres", href: "/matieres" },
  { label: "FAQ", href: "/faq" },
];

export function MobileMenu({ isLoggedIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setAnimating(false);
    setOpen(false);
  }, []);

  // Fermer le menu au changement de page
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional close on route change
    close();
  }, [pathname, close]);

  // Gerer l'affichage pour l'animation
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- needed for animation sequencing
      setVisible(true);
      // Force le rendu initial avec translate-x-full, puis declenche l'animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
        });
      });
    } else {
      setAnimating(false);
      // Delai pour laisser l'animation de sortie se jouer
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Empecher le scroll quand le menu est ouvert
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Gestion de l'ouverture
  const handleOpen = () => {
    setAnimating(false);
    setOpen(true);
  };

  return (
    <>
      {/* Bouton hamburger */}
      <button
        onClick={handleOpen}
        className="md:hidden text-primary p-2 -mr-2"
        aria-label="Ouvrir le menu"
      >
        <span className="material-symbols-outlined text-[28px]">menu</span>
      </button>

      {visible && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 z-[60] bg-black/50 md:hidden transition-opacity duration-300 ${
              animating ? "opacity-100" : "opacity-0"
            }`}
            onClick={close}
          />

          {/* Panneau lateral */}
          <div
            ref={panelRef}
            className={`fixed top-0 right-0 z-[70] h-dvh w-[300px] max-w-[85vw] md:hidden flex flex-col transition-transform duration-300 ease-in-out ${
              animating ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* En-tete du panneau */}
            <div className="flex items-center justify-between px-margin-mobile h-20 border-b border-outline-variant/30 shrink-0">
              <span
                className="font-headline-sm text-headline-sm italic text-primary"
                style={{ fontFamily: "Libre Caslon Text" }}
              >
                ExamMarket
              </span>
              <button
                onClick={close}
                className="text-primary p-2 -mr-2"
                aria-label="Fermer le menu"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col py-6 px-margin-mobile gap-1 overflow-y-auto">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="font-body-lg text-body-lg text-on-surface-variant hover:text-primary py-3 px-2 transition-colors border-b border-outline-variant/20"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="mt-auto border-t border-outline-variant/30 px-margin-mobile py-8 flex flex-col gap-4 shrink-0">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={close}
                    className="font-label-caps text-label-caps text-center text-on-surface-variant hover:text-primary py-3 transition-colors border border-outline-variant"
                  >
                    Dashboard
                  </Link>
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="w-full font-label-caps text-label-caps text-on-surface-variant hover:text-primary py-3 transition-colors border border-outline-variant"
                    >
                      Deconnexion
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    onClick={close}
                    className="font-label-caps text-label-caps text-center text-primary hover:text-secondary transition-colors py-3 underline decoration-secondary-fixed/0 hover:decoration-secondary/50 underline-offset-4"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    onClick={close}
                    className="font-label-caps text-label-caps text-center bg-primary text-on-primary py-3 hover:bg-inverse-surface transition-colors"
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
