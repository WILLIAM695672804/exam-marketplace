"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ExamItem {
  id: string;
  title: string;
  slug: string;
  year: number;
  price: number;
  priceWithCorrection: number | null;
  status: string;
  competition: { name: string; category: { name: string } };
  subject: { name: string };
  author: { firstName: string; lastName: string };
  _count: { orderItems: number };
}

const CATEGORIES = [
  "Finance & Comptabilite",
  "Droit & Juridique",
  "Medecine",
  "Ingenierie",
  "Informatique",
];

const COMPETITIONS = [
  { value: "", label: "Selectionner un concours" },
  { value: "cfa", label: "CFA Level I" },
  { value: "bar", label: "Barreau (NY)" },
  { value: "mcat", label: "MCAT" },
  { value: "usmle", label: "USMLE" },
];

const SUBJECTS = [
  "Finance d'entreprise",
  "Contrats",
  "Biologie",
  "Ethique",
  "Methodes quantitatives",
  "Droit constitutionnel",
];

export default function CataloguePage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState(500);
  const [correctionFilter, setCorrectionFilter] = useState("Tout");
  const [sortBy, setSortBy] = useState("popularity");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCompetition) params.set("competitionId", selectedCompetition);
    if (priceRange < 500) params.set("maxPrice", String(priceRange));
    params.set("sortBy", sortBy === "popularity" ? "createdAt" : sortBy === "price_low" ? "price_asc" : sortBy === "price_high" ? "price_desc" : "year");
    params.set("page", String(currentPage));
    params.set("limit", "6");

    try {
      const res = await fetch(`/api/exam-papers?${params}`);
      const data = await res.json();
      setExams(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      // API inaccessible, garder les donnees precedentes
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCompetition, priceRange, sortBy, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchExams is an async data fetcher that sets state in callbacks, not synchronously
    void fetchExams();
  }, [fetchExams]);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
    setCurrentPage(1);
  }

  function toggleSubject(subj: string) {
    setSelectedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj],
    );
    setCurrentPage(1);
  }

  function clearFilters() {
    setSelectedCategories([]);
    setSelectedCompetition("");
    setSelectedSubjects([]);
    setPriceRange(500);
    setCorrectionFilter("Tout");
    setSearchQuery("");
    setSortBy("popularity");
    setCurrentPage(1);
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <main className="flex-grow max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg md:py-section-gap flex flex-col lg:flex-row gap-gutter">
      {/* Left Sidebar — Filters */}
      <aside className="w-full lg:w-1/4 flex-shrink-0 space-y-stack-lg border-r border-outline-variant pr-gutter pb-section-gap lg:pb-0 hidden md:block">
        <h2 className="font-headline-sm text-headline-sm mb-stack-lg">Filtres</h2>

        <div className="space-y-stack-sm border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Categorie</h3>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} className="border-outline-variant text-primary focus:ring-primary w-4 h-4 rounded-none" />
                <span className="font-body-sm text-body-sm">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-stack-sm border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Concours</h3>
          <select value={selectedCompetition} onChange={(e) => { setSelectedCompetition(e.target.value); setCurrentPage(1); }} className="w-full bg-transparent border-b border-outline-variant pb-2 font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-0 rounded-none">
            {COMPETITIONS.map((comp) => <option key={comp.value} value={comp.value}>{comp.label}</option>)}
          </select>
        </div>

        <div className="space-y-stack-sm border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Matiere</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {SUBJECTS.map((subj) => (
              <label key={subj} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selectedSubjects.includes(subj)} onChange={() => toggleSubject(subj)} className="border-outline-variant text-primary focus:ring-primary w-4 h-4 rounded-none" />
                <span className="font-body-sm text-body-sm">{subj}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-stack-sm border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase flex justify-between">
            <span>Prix</span>
            <span>$0 - ${priceRange}</span>
          </h3>
          <div className="pt-2">
            <input type="range" className="w-full" max={500} min={0} value={priceRange} onChange={(e) => { setPriceRange(Number(e.target.value)); setCurrentPage(1); }} />
          </div>
        </div>

        <div className="space-y-stack-sm pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Corrige</h3>
          <div className="space-y-2">
            {["Tout", "Avec corrige", "Sans corrige"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="correction" checked={correctionFilter === opt} onChange={() => { setCorrectionFilter(opt); setCurrentPage(1); }} className="border-outline-variant text-primary focus:ring-primary w-4 h-4" />
                <span className="font-body-sm text-body-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <button onClick={clearFilters} className="w-full border border-primary text-primary font-label-caps text-label-caps py-3 uppercase hover:bg-surface-container transition-colors mt-4">
          Reinitialiser les filtres
        </button>
      </aside>

      {/* Right Content */}
      <section className="w-full lg:w-3/4 flex flex-col gap-stack-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-md border-b border-outline-variant pb-stack-md">
          <div className="relative w-full md:w-1/2">
            <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-outline-variant text-body-lg font-body-lg focus:outline-none focus:border-primary focus:ring-0 transition-colors placeholder:text-on-surface-variant" placeholder="Rechercher des epreuves..." type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <span className="font-body-sm text-body-sm text-on-surface-variant">{total} resultats</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent border-b border-outline-variant pb-1 font-label-caps text-label-caps focus:outline-none focus:border-primary focus:ring-0 uppercase cursor-pointer rounded-none">
              <option value="popularity">Popularite</option>
              <option value="date">Date</option>
              <option value="price_low">Prix: Croissant</option>
              <option value="price_high">Prix: Decroissant</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-outline-variant p-stack-md bg-surface-container-lowest animate-pulse">
                <div className="mb-4 aspect-[4/3] bg-surface-container w-full" />
                <div className="h-6 bg-surface-container w-3/4 mb-2" />
                <div className="h-4 bg-surface-container w-1/2" />
              </div>
            ))}
          </div>
        ) : exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
            {exams.map((exam) => (
              <Link key={exam.id} href={`/epreuve/${exam.slug}`} className="group border border-outline-variant p-stack-md flex flex-col hover:border-primary transition-colors bg-surface-container-lowest">
                <div className="mb-4 aspect-[4/3] bg-surface-variant w-full overflow-hidden flex items-center justify-center">
                  <span className="font-headline-lg text-[64px] text-on-surface-variant/20 select-none group-hover:scale-105 transition-transform duration-500">
                    {exam.title.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="font-label-caps text-label-caps px-3 py-1 bg-surface-container-highest text-on-surface">{exam.year}</span>
                  <span className="font-label-caps text-label-caps text-secondary">{exam.subject.name}</span>
                </div>
                <h3 className="font-headline-sm mb-2 line-clamp-2 leading-tight">{exam.title}</h3>
                <div className="flex items-center justify-between mt-auto pt-4">
                  <span className="font-body-lg font-bold">${Number(exam.price).toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-section-gap text-center border border-outline-variant bg-surface-container-lowest">
            <span className="material-symbols-outlined text-outline text-[48px] mb-4">search_off</span>
            <h2 className="font-headline-md text-headline-md mb-2">Aucune epreuve</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">Essayez d&apos;ajuster vos filtres ou vos termes de recherche.</p>
            <button onClick={clearFilters} className="border border-primary text-primary font-label-caps text-label-caps px-6 py-3 uppercase hover:bg-surface-container transition-colors">Reinitialiser les filtres</button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-section-gap border-t border-outline-variant pt-stack-lg">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps uppercase disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>Precedent
            </button>
            <div className="flex gap-2 font-body-md text-body-md">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button key={page} onClick={() => goToPage(page)} className={`w-8 h-8 flex items-center justify-center transition-colors ${page === currentPage ? "bg-primary text-on-primary" : "hover:bg-surface-container"}`}>
                    {page}
                  </button>
                );
              })}
            </div>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps uppercase disabled:opacity-50">
              Suivant<span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
