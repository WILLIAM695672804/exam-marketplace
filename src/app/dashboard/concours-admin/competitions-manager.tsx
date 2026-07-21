"use client";

import { useState } from "react";

interface Competition {
  id: string;
  name: string;
  slug: string;
  organisme: string | null;
  category: { id: string; name: string };
  _count: { subjects: number; examPapers: number };
}

interface Category {
  id: string;
  name: string;
}

export function CompetitionsManager({
  initialCompetitions,
  categories,
}: {
  initialCompetitions: Competition[];
  categories: Category[];
}) {
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [editing, setEditing] = useState<Competition | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, setPending] = useState(false);

  function resetForm() {
    setEditing(null);
    setShowAdd(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, isEdit: boolean) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      slug:
        (form.get("slug") as string) ||
        (form.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
      categoryId: form.get("categoryId") as string,
      organisme: (form.get("organisme") as string) || null,
    };

    const res = await fetch("/api/concours", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: editing!.id, ...body } : body),
    });
    if (res.ok) {
      const data = await res.json();
      if (isEdit)
        setCompetitions(
          (prev) =>
            prev.map((c) =>
              c.id === editing!.id ? { ...c, name: body.name, organisme: body.organisme } : c
            ) as Competition[]
        );
      else setCompetitions((prev) => [...prev, data as Competition]);
      resetForm();
    }
    setPending(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce concours ?")) return;
    const res = await fetch("/api/concours", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setCompetitions((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-container-max mx-auto w-full">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="font-headline-md text-primary mb-2">Gerer les concours</h2>
          <p className="font-body-md text-on-surface-variant">
            Ajouter, modifier ou supprimer des concours.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAdd(true);
          }}
          className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-3 px-6 hover:bg-inverse-surface transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>Ajouter
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="mb-12 bg-surface-container-lowest border border-outline-variant p-8">
          <h3 className="font-headline-sm text-primary mb-6">
            {editing ? "Modifier" : "Nouveau"} concours
          </h3>
          <form onSubmit={(e) => handleSubmit(e, !!editing)} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2"
              >
                Nom
              </label>
              <input
                id="name"
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="slug"
                className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2"
              >
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                defaultValue={editing?.slug}
                className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="categoryId"
                className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2"
              >
                Categorie
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                defaultValue={editing?.category?.id || ""}
                className="w-full bg-transparent border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary outline-none"
              >
                <option value="">Selectionner</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="organisme"
                className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2"
              >
                Organisme
              </label>
              <input
                id="organisme"
                name="organisme"
                defaultValue={editing?.organisme || ""}
                className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary outline-none"
              />
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={pending}
                className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-3 px-6 hover:bg-inverse-surface transition-colors disabled:opacity-70"
              >
                {pending ? "..." : editing ? "Modifier" : "Creer"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="border border-primary text-primary font-label-caps text-label-caps uppercase py-3 px-6 hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-outline-variant bg-surface-container-lowest overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant">
              {["Nom", "Categorie", "Matieres", "Epreuves", "Actions"].map((h) => (
                <th
                  key={h}
                  className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {competitions.map((comp) => (
              <tr
                key={comp.id}
                className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors"
              >
                <td className="px-6 py-4 font-body-md text-primary">{comp.name}</td>
                <td className="px-6 py-4 font-body-sm text-on-surface-variant">
                  {comp.category?.name ?? "—"}
                </td>
                <td className="px-6 py-4 font-body-sm text-on-surface-variant">
                  {comp._count?.subjects ?? 0}
                </td>
                <td className="px-6 py-4 font-body-sm text-on-surface-variant">
                  {comp._count?.examPapers ?? 0}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditing(comp)}
                    className="p-2 hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(comp.id)}
                    className="p-2 hover:bg-error-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
