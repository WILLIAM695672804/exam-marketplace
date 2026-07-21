"use client";

import { useState } from "react";

interface Subject {
  id: string;
  name: string;
  slug: string;
  competition: { id: string; name: string };
  _count: { examPapers: number };
}
interface Competition {
  id: string;
  name: string;
}

export function SubjectsManager({
  initialSubjects,
  competitions,
}: {
  initialSubjects: Subject[];
  competitions: Competition[];
}) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [editing, setEditing] = useState<Subject | null>(null);
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
      competitionId: form.get("competitionId") as string,
    };
    const res = await fetch("/api/subjects", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: editing!.id, ...body } : body),
    });
    if (res.ok) {
      const data = await res.json();
      if (isEdit)
        setSubjects(
          (prev) =>
            prev.map((s) => (s.id === editing!.id ? { ...s, name: body.name } : s)) as Subject[]
        );
      else setSubjects((prev) => [...prev, data as Subject]);
      resetForm();
    }
    setPending(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette matiere ?")) return;
    const res = await fetch("/api/subjects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setSubjects((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="max-w-container-max mx-auto w-full">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="font-headline-md text-primary mb-2">Gerer les matieres</h2>
          <p className="font-body-md text-on-surface-variant">
            Ajouter, modifier ou supprimer des matieres.
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
            {editing ? "Modifier" : "Nouvelle"} matiere
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
                htmlFor="competitionId"
                className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2"
              >
                Concours
              </label>
              <select
                id="competitionId"
                name="competitionId"
                required
                defaultValue={editing?.competition?.id || ""}
                className="w-full bg-transparent border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary outline-none"
              >
                <option value="">Selectionner</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
              {["Nom", "Concours", "Epreuves", "Actions"].map((h) => (
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
            {subjects.map((s) => (
              <tr
                key={s.id}
                className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors"
              >
                <td className="px-6 py-4 font-body-md text-primary">{s.name}</td>
                <td className="px-6 py-4 font-body-sm text-on-surface-variant">
                  {s.competition?.name ?? "—"}
                </td>
                <td className="px-6 py-4 font-body-sm text-on-surface-variant">
                  {s._count?.examPapers ?? 0}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditing(s)}
                    className="p-2 hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
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
