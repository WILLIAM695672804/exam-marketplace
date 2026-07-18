"use client";

import { useState } from "react";

export function ParametresContent() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      for (const [key, value] of form.entries()) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
      }
      setMessage({ type: "success", text: "Parametres enregistres." });
    } catch {
      setMessage({ type: "error", text: "Erreur." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-[720px] mx-auto w-full">
      <div className="mb-12">
        <h2 className="font-headline-md text-primary mb-2">Parametres</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Configurer les preferences de la plateforme.</p>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant p-8 md:p-12 space-y-12">
        {message && <div className={`font-body-sm p-3 border ${message.type === "success" ? "bg-secondary-container text-on-secondary-container border-secondary/30" : "bg-error-container text-on-error-container border-error/30"}`}>{message.text}</div>}
        <form onSubmit={handleSubmit} className="space-y-12">
          {[{ title: "Commission", label: "Taux de commission (%)", name: "commission_rate", def: "15" }, { title: "Telechargements", label: "Nombre max de telechargements", name: "max_downloads_per_purchase", def: "5" }, { title: "Plateforme", label: "Nom de la plateforme", name: "platform_name", def: "Exam Marketplace" }].map((s) => (
            <div key={s.name}>
              <h3 className="font-headline-sm text-primary mb-6 border-b border-outline-variant pb-2">{s.title}</h3>
              <div className="relative mt-4">
                <label htmlFor={s.name} className="font-label-caps text-label-caps text-on-surface-variant uppercase">{s.label}</label>
                <input id={s.name} name={s.name} type="text" defaultValue={s.def} className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors outline-none" />
              </div>
            </div>
          ))}
          <div className="pt-8 border-t border-outline-variant">
            <button type="submit" disabled={pending} className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-4 px-8 hover:bg-inverse-surface transition-colors disabled:opacity-70">
              {pending ? "Enregistrement..." : "Enregistrer les parametres"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
