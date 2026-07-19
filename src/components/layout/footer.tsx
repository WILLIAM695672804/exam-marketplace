import Link from "next/link";

const FOOTER_LINKS = {
  plateforme: [
    { label: "Catalogue", href: "/catalogue" },
    { label: "Categories", href: "/categories" },
    { label: "Concours", href: "/concours" },
    { label: "Matieres", href: "/matieres" },
  ],
  entreprise: [
    { label: "A propos", href: "/a-propos" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
  juridique: [
    { label: "Conditions d'utilisation", href: "#" },
    { label: "Politique de confidentialite", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="w-full bg-background border-t border-outline-variant">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter px-margin-mobile md:px-margin-desktop py-section-gap max-w-container-max mx-auto">
        {/* Brand */}
        <div className="md:col-span-4 flex flex-col justify-between min-h-[200px]">
          <Link
            href="/"
            className="font-headline-md text-headline-md italic"
            style={{ fontFamily: "Libre Caslon Text" }}
          >
            ExamMarket
          </Link>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-auto">
            &copy; {new Date().getFullYear()} ExamMarket. Excellence in Professional Certification.
          </p>
        </div>

        {/* Links */}
        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 md:pl-16 mt-12 md:mt-0">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-4">
              <span className="font-label-caps text-label-caps text-primary mb-2">
                {category === "plateforme"
                  ? "Plateforme"
                  : category === "entreprise"
                    ? "Entreprise"
                    : "Juridique"}
              </span>
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-body-sm text-body-sm text-on-surface-variant hover:underline decoration-secondary-fixed underline-offset-4 opacity-80 hover:opacity-100 transition-opacity"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
