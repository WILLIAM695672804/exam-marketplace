"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function PublierContent({ isAdmin = false }: { isAdmin?: boolean }) {
  const [hasCorrection, setHasCorrection] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paperFileId, setPaperFileId] = useState<string | null>(null);
  const [correctionFileId, setCorrectionFileId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [competitions, setCompetitions] = useState<
    { id: string; name: string; categoryId: string }[]
  >([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; competitionId: string }[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when dependency changes
      setCompetitions([]);
      return;
    }
    fetch(`/api/concours?categoryId=${selectedCategory}`)
      .then((r) => r.json())
      .then((data) =>
        setCompetitions(
          data.filter((c: { categoryId: string }) => c.categoryId === selectedCategory)
        )
      );
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCompetition) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when dependency changes
      setSubjects([]);
      return;
    }
    fetch(`/api/subjects?competitionId=${selectedCompetition}`)
      .then((r) => r.json())
      .then((data) =>
        setSubjects(
          data.filter((s: { competitionId: string }) => s.competitionId === selectedCompetition)
        )
      );
  }, [selectedCompetition]);

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/files", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Echec upload");
    const data = await res.json();
    return data.id;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/exam-papers", { method: "POST", body: form });
      if (res.ok) router.push("/dashboard/mes-epreuves");
      else throw new Error("Echec publication");
    } catch {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto w-full">
      <div className="mb-stack-lg md:mb-16">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-4">
          Publier une epreuve
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Creez et distribuez vos epreuves sur notre plateforme.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant p-6 md:p-12 w-full">
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-8">
            <div>
              <h2 className="font-headline-sm text-primary mb-6 border-b border-outline-variant pb-2">
                I. Details de l&apos;epreuve
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-1 md:col-span-2 relative mt-4">
                  <label
                    className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                    htmlFor="title"
                  >
                    Titre
                  </label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary placeholder:text-outline focus:ring-0 focus:border-primary transition-colors outline-none"
                    id="title"
                    name="title"
                    placeholder="Ex: CFA Level I Mock Exam 2024"
                    required
                    type="text"
                  />
                </div>
                <div className="relative mt-4">
                  <label
                    className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                    htmlFor="slug"
                  >
                    Slug
                  </label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary placeholder:text-outline focus:ring-0 focus:border-primary transition-colors outline-none"
                    id="slug"
                    name="slug"
                    placeholder="cfa-level-i-2024"
                    required
                    type="text"
                  />
                </div>
                <div className="relative mt-4">
                  <label
                    className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                    htmlFor="year"
                  >
                    Annee
                  </label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors outline-none"
                    id="year"
                    name="year"
                    type="number"
                    defaultValue={2024}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative mt-4">
                <label
                  className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                  htmlFor="categoryId"
                >
                  Categorie
                </label>
                <select
                  className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors rounded-none appearance-none outline-none"
                  id="categoryId"
                  name="categoryId"
                  required
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedCompetition("");
                  }}
                >
                  <option value="">Selectionner</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-0 top-1/2 pointer-events-none text-outline-variant">
                  expand_more
                </span>
              </div>
              <div className="relative mt-4">
                <label
                  className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                  htmlFor="competitionId"
                >
                  Concours
                </label>
                <select
                  className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors rounded-none appearance-none outline-none"
                  id="competitionId"
                  name="competitionId"
                  required
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  disabled={!selectedCategory}
                >
                  <option value="">Selectionner</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-0 top-1/2 pointer-events-none text-outline-variant">
                  expand_more
                </span>
              </div>
              <div className="relative mt-4">
                <label
                  className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                  htmlFor="subjectId"
                >
                  Matiere
                </label>
                <select
                  className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors rounded-none appearance-none outline-none"
                  id="subjectId"
                  name="subjectId"
                  required
                  disabled={!selectedCompetition}
                >
                  <option value="">Selectionner</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-0 top-1/2 pointer-events-none text-outline-variant">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Informations du professeur (admin uniquement) */}
          {isAdmin && (
            <div className="space-y-8 pt-8">
              <h2 className="font-headline-sm text-primary mb-6 border-b border-outline-variant pb-2">
                I-bis. Professeur ayant remis l&apos;epreuve
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative mt-4">
                  <label
                    className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                    htmlFor="professorName"
                  >
                    Nom du professeur
                  </label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary placeholder:text-outline focus:ring-0 focus:border-primary transition-colors outline-none"
                    id="professorName"
                    name="professorName"
                    placeholder="Ex: Pr. Kamga"
                    type="text"
                  />
                </div>
                <div className="relative mt-4">
                  <label
                    className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                    htmlFor="professorPhone"
                  >
                    Telephone du professeur
                  </label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary placeholder:text-outline focus:ring-0 focus:border-primary transition-colors outline-none"
                    id="professorPhone"
                    name="professorPhone"
                    placeholder="Ex: +237 6XX XXX XXX"
                    type="tel"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8 pt-8">
            <h2 className="font-headline-sm text-primary mb-6 border-b border-outline-variant pb-2">
              II. Contenu &amp; Prix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="relative mt-4">
                  <label
                    className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                    htmlFor="price"
                  >
                    Prix de l&apos;epreuve seule
                  </label>
                  <div className="flex items-end">
                    <input
                      className="flex-1 bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary placeholder:text-outline focus:ring-0 focus:border-primary transition-colors outline-none"
                      id="price"
                      name="price"
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      required
                    />
                    <span className="font-label-caps text-label-caps text-on-surface-variant ml-2 mb-2">
                      FCFA
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4">
                    Fichier de l&apos;epreuve
                  </p>
                  <label className="border-2 border-dashed border-outline-variant hover:border-primary h-40 flex flex-col items-center justify-center cursor-pointer bg-surface-container-lowest transition-colors">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">
                      picture_as_pdf
                    </span>
                    <p className="font-body-sm text-primary font-medium">
                      {paperFileId ? "Fichier uploade" : "Cliquez pour uploader le PDF"}
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setPaperFileId(await uploadFile(f));
                        }
                      }}
                    />
                    <input type="hidden" name="paperFileId" value={paperFileId || ""} />
                  </label>
                </div>
              </div>

              <div className="space-y-8 md:border-l border-outline-variant md:pl-12">
                <div className="flex items-center gap-3 bg-surface-container-low p-4">
                  <input
                    className="w-5 h-5 border-outline-variant text-primary focus:ring-primary bg-transparent cursor-pointer"
                    id="add-correction"
                    type="checkbox"
                    checked={hasCorrection}
                    onChange={(e) => setHasCorrection(e.target.checked)}
                  />
                  <label
                    className="font-body-md text-primary font-medium cursor-pointer select-none"
                    htmlFor="add-correction"
                  >
                    Inclure un guide de correction
                  </label>
                </div>
                <div
                  className={`space-y-8 transition-opacity duration-300 ${hasCorrection ? "opacity-100" : "opacity-50 pointer-events-none"}`}
                >
                  <div className="relative mt-4">
                    <label
                      className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                      htmlFor="priceWithCorrection"
                    >
                      Prix du pack (Epreuve + Corrige)
                    </label>
                    <div className="flex items-end">
                      <input
                        className="flex-1 bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary placeholder:text-outline focus:ring-0 focus:border-primary transition-colors outline-none"
                        id="priceWithCorrection"
                        name="priceWithCorrection"
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        disabled={!hasCorrection}
                      />
                      <span className="font-label-caps text-label-caps text-on-surface-variant ml-2 mb-2">
                        FCFA
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4">
                      Fichier du corrige
                    </p>
                    <label
                      className={`border-2 border-dashed border-outline-variant h-40 flex flex-col items-center justify-center bg-surface-container-lowest transition-colors ${hasCorrection ? "cursor-pointer hover:border-primary" : "cursor-not-allowed"}`}
                    >
                      <span className="material-symbols-outlined text-4xl text-outline mb-2">
                        task
                      </span>
                      <p
                        className={`font-body-sm font-medium ${hasCorrection ? "text-primary" : "text-outline"}`}
                      >
                        {correctionFileId ? "Fichier uploade" : "Uploader le corrige PDF"}
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        disabled={!hasCorrection}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setCorrectionFileId(await uploadFile(f));
                          }
                        }}
                      />
                      <input type="hidden" name="correctionFileId" value={correctionFileId || ""} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 mt-12 border-t border-outline-variant flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-6">
            <button
              type="button"
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors uppercase font-semibold underline decoration-transparent hover:decoration-secondary underline-offset-4"
            >
              Sauvegarder le brouillon
            </button>
            <button
              type="submit"
              disabled={uploading || !paperFileId}
              className="w-full sm:w-auto bg-primary text-on-primary px-10 py-4 font-label-caps text-label-caps uppercase hover:bg-inverse-surface transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {uploading ? "Publication..." : "Publier l'epreuve"}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
