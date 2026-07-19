"use client";

import { useState } from "react";

export function ProfilContent() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          phone: form.get("phone"),
        }),
      });
      if (res.ok) setMessage({ type: "success", text: "Profil mis a jour." });
      else setMessage({ type: "error", text: "Erreur lors de la mise a jour." });
    } catch {
      setMessage({ type: "error", text: "Erreur reseau." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-[720px] mx-auto w-full">
      <div className="mb-12">
        <h2 className="font-headline-md text-primary mb-2">Mon Profil</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Gerer vos informations personnelles.
        </p>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {message && (
            <div
              className={`font-body-sm p-3 border ${message.type === "success" ? "bg-secondary-container text-on-secondary-container border-secondary/30" : "bg-error-container text-on-error-container border-error/30"}`}
            >
              {message.text}
            </div>
          )}
          {[
            { label: "Prenom", name: "firstName", type: "text" },
            { label: "Nom", name: "lastName", type: "text" },
            { label: "Telephone", name: "phone", type: "tel" },
          ].map((f) => (
            <div key={f.name} className="relative mt-4">
              <label
                htmlFor={f.name}
                className="font-label-caps text-label-caps text-on-surface-variant uppercase"
              >
                {f.label}
              </label>
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors outline-none"
              />
            </div>
          ))}
          <div className="pt-8 border-t border-outline-variant">
            <button
              type="submit"
              disabled={pending}
              className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-4 px-8 hover:bg-inverse-surface transition-colors disabled:opacity-70"
            >
              {pending ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
        <div className="mt-16 pt-8 border-t border-outline-variant">
          <h3 className="font-headline-sm text-primary mb-4">Securite</h3>
          <a
            href="/mot-de-passe-oublie"
            className="py-2 px-6 border border-primary text-primary font-label-caps text-label-caps uppercase hover:bg-surface-container transition-colors inline-block"
          >
            Changer le mot de passe
          </a>
        </div>
      </div>
    </div>
  );
}
