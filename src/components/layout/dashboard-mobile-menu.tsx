"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardMobileMenuProps {
  userEmail: string;
  userRoles: string[];
  sidebarLinks: { label: string; href: string }[];
}

export function DashboardMobileMenu({
  userEmail,
  userRoles,
  sidebarLinks,
}: DashboardMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const pathname = usePathname();

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
      // Force le rendu initial avec -translate-x-full, puis declenche l'animation
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
      {/* Bouton hamburger - visible uniquement sur mobile */}
      <button
        onClick={handleOpen}
        className="md:hidden text-primary p-2 -mr-2"
        aria-label="Ouvrir le menu"
      >
        <span className="material-symbols-outlined text-[28px]">menu</span>
      </button>

      {/* Mobile sidebar overlay + panneau */}
      {visible && (
        <>
          <div
            className={`fixed inset-0 z-[60] bg-black/50 md:hidden transition-opacity duration-300 ${
              animating ? "opacity-100" : "opacity-0"
            }`}
            onClick={close}
          />
          <div
            className={`fixed top-0 left-0 z-[70] h-dvh w-[280px] max-w-[85vw] md:hidden flex flex-col transition-transform duration-300 ease-in-out ${
              animating ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* En-tete */}
            <div className="flex items-center justify-between px-margin-mobile h-16 border-b border-outline-variant/30 shrink-0">
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

            {/* Email + roles */}
            <div className="px-margin-mobile py-4 border-b border-outline-variant/20 shrink-0">
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {userEmail}
              </p>
              <p className="font-label-caps text-[10px] text-on-surface-variant/60 mt-1">
                {userRoles.join(", ")}
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col py-4 px-margin-mobile gap-0.5 overflow-y-auto">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-2.5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Deconnexion mobile */}
            <div className="mt-auto border-t border-outline-variant/30 px-margin-mobile py-6 shrink-0">
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-full text-left font-body-md text-body-md text-error py-3 transition-colors"
                >
                  Deconnexion
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
