import Link from "next/link";
import { examRepository } from "@/features/exams/repositories/exam.repository";
import { categoryRepository } from "@/features/categories/repositories/category.repository";

const CATEGORY_ICONS: Record<string, string> = {
  finance: "account_balance",
  banque: "account_balance",
  medical: "medical_services",
  medecine: "medical_services",
  sante: "medical_services",
  juridique: "gavel",
  droit: "gavel",
  barreau: "gavel",
  ingenierie: "architecture",
  tech: "architecture",
  informatique: "computer",
  sciences: "science",
  mathematiques: "function",
  langues: "translate",
  economie: "trending_up",
  gestion: "business_center",
  commerce: "storefront",
  art: "palette",
  musique: "music_note",
  sport: "fitness_center",
};

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(keyword)) return icon;
  }
  return "school";
}

export default async function HomePage() {
  const [recentExamsResult, categories] = await Promise.all([
    examRepository.findAll({
      limit: 3,
      sortBy: "createdAt",
      status: "PUBLISHED",
    }),
    categoryRepository.findAll(),
  ]);

  const { items: recentExams } = recentExamsResult;
  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[870px] min-h-[600px] flex flex-col justify-end pb-section-gap px-margin-mobile md:px-margin-desktop pt-32">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 bg-surface-variant">
          <div className="w-full h-full bg-cover bg-center opacity-80 mix-blend-multiply bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80')]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-container-max mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-gutter items-end">
          <div className="md:col-span-8 lg:col-span-7">
            <h1 className="font-display-lg text-primary mb-stack-lg tracking-tight">
              La bibliotheque definitive pour votre reussite aux examens
            </h1>

            {/* Search Bar */}
            <div className="w-full max-w-xl relative mt-12 group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px]">search</span>
              </div>
              <input
                className="w-full bg-surface-container-lowest/80 backdrop-blur-sm border-b-2 border-outline-variant hover:border-primary focus:border-primary focus:ring-0 pl-14 pr-28 py-6 font-body-lg text-body-lg text-primary placeholder-on-surface-variant transition-colors duration-300 outline-none"
                placeholder="Rechercher un concours, une matiere..."
                type="text"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                suppressHydrationWarning
              />
              <Link
                href="/catalogue"
                className="absolute inset-y-2 right-2 flex items-center justify-center px-6 bg-primary text-on-primary font-label-caps text-label-caps hover:bg-inverse-surface transition-colors duration-300"
              >
                Rechercher
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-background">
        <div className="max-w-container-max mx-auto">
          <div className="flex justify-between items-end mb-16 border-b border-outline-variant pb-stack-lg">
            <h2 className="font-headline-md text-primary">(CATEGORIES)</h2>
            <Link
              href="/categories"
              className="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors inline-flex items-center gap-2 group"
            >
              Explorer tout{" "}
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {categories.length === 0 ? (
              <p className="text-center text-on-surface-variant py-20 sm:col-span-2 lg:col-span-4">
                Aucune categorie disponible pour le moment.
              </p>
            ) : (
              categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalogue?category=${encodeURIComponent(cat.name)}`}
                  className="group block p-8 bg-surface-container-lowest border border-outline-variant hover:border-secondary transition-colors duration-300 flex flex-col justify-between h-64"
                >
                  <span className="material-symbols-outlined text-[32px] text-primary group-hover:text-secondary transition-colors">
                    {getCategoryIcon(cat.name)}
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-primary mb-2">{cat.name}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {cat.description || `${cat._count.competitions} concours`}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Trust/Statistics */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          <div className="md:col-span-5">
            <h2 className="font-headline-lg text-primary mb-stack-md leading-tight">
              DESIGN INTEMPOREL.
              <br />
              APPRENTISSAGE
              <br />
              D&apos;EXCELLENCE.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 flex flex-col sm:flex-row gap-16 md:gap-24">
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-[100px] leading-none text-secondary-fixed-dim font-serif">
                  60
                </span>
                <span className="font-headline-md text-secondary-fixed-dim">%</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-4 max-w-[200px]">
                taux de reussite supplementaire pour les candidats utilisant nos archives.
              </p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-[100px] leading-none text-secondary-fixed-dim font-serif">
                  30
                </span>
                <span className="font-headline-md text-secondary-fixed-dim">+</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-4 max-w-[200px]">
                annees d&apos;excellence academique et de confiance institutionnelle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Published */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-background">
        <div className="max-w-container-max mx-auto">
          <div className="flex justify-between items-end mb-16 border-b border-outline-variant pb-stack-lg">
            <h2 className="font-headline-md text-primary">(PUBLICATIONS RECENTES)</h2>
            <Link
              href="/catalogue"
              className="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors inline-flex items-center gap-2 group"
            >
              Tout voir{" "}
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {recentExams.length === 0 ? (
              <p className="text-center text-on-surface-variant py-20 md:col-span-3">
                Aucune epreuve publiee pour le moment.
              </p>
            ) : (
              recentExams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/epreuve/${exam.slug}`}
                  className="flex flex-col group cursor-pointer"
                >
                  <div className="mb-4">
                    <div className="w-full aspect-[4/3] bg-surface-variant flex items-center justify-center group-hover:bg-surface-container-high transition-colors duration-500">
                      <span className="font-headline-lg text-[64px] text-on-surface-variant/20 select-none">
                        {exam.title.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="font-label-caps text-label-caps px-3 py-1 bg-surface-container-highest text-on-surface">
                      {exam.year}
                    </span>
                    <span className="font-label-caps text-label-caps text-secondary">
                      {exam.subject.name}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-primary mb-2 group-hover:text-secondary transition-colors">
                    {exam.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 flex-grow">
                    Par {exam.author.firstName} {exam.author.lastName}
                  </p>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant">
                    <span className="font-body-lg text-body-lg font-bold text-primary">
                      ${Number(exam.price).toFixed(2)}
                    </span>
                    <span className="font-label-caps text-label-caps text-primary border-b border-secondary hover:text-secondary transition-colors pb-1 inline-flex items-center gap-1">
                      Voir l&apos;epreuve{" "}
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto text-center">
          <h2 className="font-headline-md text-primary mb-24">(LE PROCESSUS)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-[1px] bg-outline-variant -z-10 -translate-y-1/2" />
            {[
              {
                step: "1. Parcourir",
                icon: "search",
                desc: "Naviguez dans notre vaste bibliotheque d'examens professionnels et de documents institutionnels.",
              },
              {
                step: "2. Payer",
                icon: "credit_card",
                desc: "Acquerrez un acces securise a vos epreuves via notre portail de transaction simplifie.",
              },
              {
                step: "3. Telecharger",
                icon: "download",
                desc: "Recevez instantanement vos documents haute fidelite et commencez votre preparation.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center bg-surface-container-lowest relative z-10 px-8"
              >
                <div className="w-16 h-16 flex items-center justify-center mb-6 bg-surface-container text-primary">
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                </div>
                <h3 className="font-headline-sm text-primary mb-4">{item.step}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mx-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
