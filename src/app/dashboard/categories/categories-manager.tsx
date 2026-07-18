"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { competitions: number };
}

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, setPending] = useState(false);

  function resetForm() {
    setEditing(null);
    setShowAdd(false);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const slug = form.get("slug") as string || name.toLowerCase().replace(/\s+/g, "-");
    const desc = form.get("description") as string;

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description: desc || undefined }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, cat]);
      resetForm();
    }
    setPending(false);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setPending(true);
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;

    const res = await fetch(`/api/categories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, name, description: form.get("description") }),
    });
    if (res.ok) {
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? { ...c, name, description: form.get("description") as string } : c)));
      resetForm();
    }
    setPending(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette categorie ?")) return;
    const res = await fetch(`/api/categories`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="max-w-container-max mx-auto w-full">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="font-headline-md text-primary mb-2">Gerer les categories</h2>
          <p className="font-body-md text-on-surface-variant">Ajouter, modifier ou supprimer des categories.</p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-3 px-6 hover:bg-inverse-surface transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>Ajouter
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="mb-12 bg-surface-container-lowest border border-outline-variant p-8">
          <h3 className="font-headline-sm text-primary mb-6">{editing ? "Modifier" : "Nouvelle"} categorie</h3>
          <form onSubmit={editing ? handleEdit : handleAdd} className="space-y-6">
            <div>
              <label htmlFor="name" className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2">Nom</label>
              <input id="name" name="name" required defaultValue={editing?.name} className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary outline-none" />
            </div>
            <div>
              <label htmlFor="slug" className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2">Slug (optionnel)</label>
              <input id="slug" name="slug" defaultValue={editing?.slug} className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary outline-none" />
            </div>
            <div>
              <label htmlFor="description" className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2">Description</label>
              <textarea id="description" name="description" rows={2} defaultValue={editing?.description || ""} className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary outline-none resize-none" />
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={pending} className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-3 px-6 hover:bg-inverse-surface transition-colors disabled:opacity-70">
                {pending ? "Enregistrement..." : editing ? "Modifier" : "Creer"}
              </button>
              <button type="button" onClick={resetForm} className="border border-primary text-primary font-label-caps text-label-caps uppercase py-3 px-6 hover:bg-surface-container transition-colors">Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-outline-variant bg-surface-container-lowest overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">Nom</th>
              <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">Slug</th>
              <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">Concours</th>
              <th className="text-right font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 font-body-md text-primary">{cat.name}</td>
                <td className="px-6 py-4 font-body-sm text-on-surface-variant">{cat.slug}</td>
                <td className="px-6 py-4 font-body-sm text-on-surface-variant">{cat._count?.competitions ?? 0}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setEditing(cat)} className="p-2 hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-error-container transition-colors" disabled={(cat._count?.competitions ?? 0) > 0} title={(cat._count?.competitions ?? 0) > 0 ? "Supprimez d'abord les concours" : ""}>
                    <span className={`material-symbols-outlined text-[18px] ${(cat._count?.competitions ?? 0) > 0 ? "text-outline-variant" : "text-error"}`}>delete</span>
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
