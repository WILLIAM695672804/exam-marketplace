"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Competition {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

const PRICE_MAX = 500;

export default function CataloguePage() {
  // Donnees dynamiques pour les filtres
  const [categories, setCategories] = useState<Category[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filtres
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [priceRange, setPriceRange] = useState(PRICE_MAX);
  const [correctionFilter, setCorrectionFilter] = useState("Tout");
  const [sortBy, setSortBy] = useState("popularity");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Resultats
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Charger les categories au montage
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => {});
  }, []);

  // Recharger les concours quand la categorie change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    fetch(`/api/concours?${params}`)
      .then((res) => res.json())
      .then((data: Competition[]) => {
        setCompetitions(data);
        // Reinitialiser le concours selectionne s'il ne fait plus partie de la liste
        if (selectedCompetitionId && !data.some((c) => c.id === selectedCompetitionId)) {
          setSelectedCompetitionId("");
        }
      })
      .catch(() => {});
  }, [selectedCategoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recharger les matieres quand le concours change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCompetitionId) params.set("competitionId", selectedCompetitionId);
    fetch(`/api/subjects?${params}`)
      .then((res) => res.json())
      .then((data: Subject[]) => {
        setSubjects(data);
        // Reinitialiser la matiere si elle ne fait plus partie de la liste
        if (selectedSubjectId && !data.some((s) => s.id === selectedSubjectId)) {
          setSelectedSubjectId("");
        }
      })
      .catch(() => {});
  }, [selectedCompetitionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rechercher les epreuves
  const fetchExams = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    if (selectedCompetitionId) params.set("competitionId", selectedCompetitionId);
    if (selectedSubjectId) params.set("subjectId", selectedSubjectId);
    if (priceRange < PRICE_MAX) params.set("maxPrice", String(priceRange));
    params.set(
      "sortBy",
      sortBy === "popularity"
        ? "createdAt"
        : sortBy === "price_low"
          ? "price_asc"
          : sortBy === "price_high"
            ? "price_desc"
            : "year"
    );
    params.set("page", String(currentPage));
    params.set("limit", "6");

    try {
      const res = await fetch(`/api/exam-papers?${params}`);
      const data = await res.json();
      setExams(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      // API inaccessible
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedCategoryId,
    selectedCompetitionId,
    selectedSubjectId,
    priceRange,
    sortBy,
    currentPage,
  ]);

  useEffect(() => {
    void fetchExams();
  }, [fetchExams]);

  function clearFilters() {
    setSelectedCategoryId("");
    setSelectedCompetitionId("");
    setSelectedSubjectId("");
    setPriceRange(PRICE_MAX);
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

        {/* Categories */}
        <div className="space-y-stack-sm border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            Categorie
          </h3>
          <div className="space-y-2">
            {categories.length === 0 ? (
              <span className="font-body-sm text-on-surface-variant italic">Chargement...</span>
            ) : (
              categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategoryId === cat.id}
                    onChange={() => {
                      setSelectedCategoryId(cat.id);
                      setCurrentPage(1);
                    }}
                    className="border-outline-variant text-primary focus:ring-primary w-4 h-4"
                  />
                  <span className="font-body-sm text-body-sm">{cat.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Concours */}
        <div className="space-y-stack-sm border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            Concours
          </h3>
          <select
            value={selectedCompetitionId}
            onChange={(e) => {
              setSelectedCompetitionId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-b border-outline-variant pb-2 font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-0 rounded-none"
          >
            <option value="">Tous les concours</option>
            {competitions.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Matieres */}
        <div className="space-y-stack-sm border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            Matiere
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {subjects.length === 0 ? (
              <span className="font-body-sm text-on-surface-variant italic">
                {selectedCompetitionId ? "Aucune matiere" : "Selectionnez un concours"}
              </span>
            ) : (
              subjects.map((subj) => (
                <label key={subj.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subject"
                    checked={selectedSubjectId === subj.id}
                    onChange={() => {
                      setSelectedSubjectId(subj.id);
                      setCurrentPage(1);
                    }}
                    className="border-outline-variant text-primary focus:ring-primary w-4 h-4"
                  />
                  <span className="font-body-sm text-body-sm">{subj.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Prix */}
        <div className="space-y-stack-sm border-b border-outline-variant pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase flex justify-between">
            <span>Prix</span>
            <span>0 FCFA - {formatPrice(priceRange)}</span>
          </h3>
          <div className="pt-2">
            <input
              type="range"
              className="w-full"
              max={PRICE_MAX}
              min={0}
              value={priceRange}
              onChange={(e) => {
                setPriceRange(Number(e.target.value));
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Corrige */}
        <div className="space-y-stack-sm pb-stack-md">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            Corrige
          </h3>
          <div className="space-y-2">
            {["Tout", "Avec corrige", "Sans corrige"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="correction"
                  checked={correctionFilter === opt}
                  onChange={() => {
                    setCorrectionFilter(opt);
                    setCurrentPage(1);
                  }}
                  className="border-outline-variant text-primary focus:ring-primary w-4 h-4"
                />
                <span className="font-body-sm text-body-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={clearFilters}
          className="w-full border border-primary text-primary font-label-caps text-label-caps py-3 uppercase hover:bg-surface-container transition-colors mt-4"
        >
          Reinitialiser les filtres
        </button>
      </aside>

      {/* Right Content */}
      <section className="w-full lg:w-3/4 flex flex-col gap-stack-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-md border-b border-outline-variant pb-stack-md">
          <div className="relative w-full md:w-1/2">
            <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-outline-variant text-body-lg font-body-lg focus:outline-none focus:border-primary focus:ring-0 transition-colors placeholder:text-on-surface-variant"
              placeholder="Rechercher des epreuves..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {total} resultats
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-b border-outline-variant pb-1 font-label-caps text-label-caps focus:outline-none focus:border-primary focus:ring-0 uppercase cursor-pointer rounded-none"
            >
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
              <div
                key={i}
                className="border border-outline-variant p-stack-md bg-surface-container-lowest animate-pulse"
              >
                <div className="mb-4 aspect-[4/3] bg-surface-container w-full" />
                <div className="h-6 bg-surface-container w-3/4 mb-2" />
                <div className="h-4 bg-surface-container w-1/2" />
              </div>
            ))}
          </div>
        ) : exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
            {exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/epreuve/${exam.slug}`}
                className="group border border-outline-variant p-stack-md flex flex-col hover:border-primary transition-colors bg-surface-container-lowest"
              >
                <div className="mb-4 aspect-[4/3] bg-surface-variant w-full overflow-hidden flex items-center justify-center">
                  <span className="font-headline-lg text-[64px] text-on-surface-variant/20 select-none group-hover:scale-105 transition-transform duration-500">
                    {exam.title.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="font-label-caps text-label-caps px-3 py-1 bg-surface-container-highest text-on-surface">
                    {exam.year}
                  </span>
                  <span className="font-label-caps text-label-caps text-secondary">
                    {exam.subject.name}
                  </span>
                </div>
                <h3 className="font-headline-sm mb-2 line-clamp-2 leading-tight">{exam.title}</h3>
                <div className="flex items-center justify-between mt-auto pt-4">
                  <span className="font-body-lg font-bold">{formatPrice(exam.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-section-gap text-center border border-outline-variant bg-surface-container-lowest">
            <span className="material-symbols-outlined text-outline text-[48px] mb-4">
              search_off
            </span>
            <h2 className="font-headline-md text-headline-md mb-2">Aucune epreuve</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
              Essayez d&apos;ajuster vos filtres ou vos termes de recherche.
            </p>
            <button
              onClick={clearFilters}
              className="border border-primary text-primary font-label-caps text-label-caps px-6 py-3 uppercase hover:bg-surface-container transition-colors"
            >
              Reinitialiser les filtres
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-section-gap border-t border-outline-variant pt-stack-lg">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps uppercase disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>Precedent
            </button>
            <div className="flex gap-2 font-body-md text-body-md">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 flex items-center justify-center transition-colors ${page === currentPage ? "bg-primary text-on-primary" : "hover:bg-surface-container"}`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps uppercase disabled:opacity-50"
            >
              Suivant<span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
