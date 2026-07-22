"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function TelechargementContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleDownload() {
    if (!token) {
      setError("Aucun jeton de téléchargement fourni.");
      return;
    }

    setDownloading(true);
    setError("");

    try {
      const res = await fetch(`/api/download?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(data.error || "Échec du téléchargement.");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? "epreuve.pdf";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du téléchargement.");
    } finally {
      setDownloading(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap text-center">
        <span className="material-symbols-outlined text-[64px] text-error mb-4 block">
          error_outline
        </span>
        <h1 className="font-headline-lg text-primary mb-4">Lien invalide</h1>
        <p className="font-body-md text-on-surface-variant mb-8">
          Aucun jeton de téléchargement fourni.
        </p>
        <Link
          href="/catalogue"
          className="bg-primary text-on-primary font-label-caps text-label-caps py-3 px-8 hover:bg-inverse-surface transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="max-w-[480px] mx-auto text-center">
        {success ? (
          <>
            <span className="material-symbols-outlined text-[64px] text-green-600 mb-4 block">
              download_done
            </span>
            <h1 className="font-headline-lg text-primary mb-2">Téléchargement réussi</h1>
            <p className="font-body-md text-on-surface-variant mb-10">
              Votre épreuve a été téléchargée.
            </p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[64px] text-green-600 mb-4 block">
              check_circle
            </span>
            <h1 className="font-headline-lg text-primary mb-2">Paiement confirmé</h1>
            <p className="font-body-md text-on-surface-variant mb-10">
              Votre épreuve est prête.
            </p>
          </>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-error/10 border border-error/20 p-4 mb-6 text-left">
            <p className="font-body-sm text-error">{error}</p>
          </div>
        )}

        {/* Bouton téléchargement */}
        {!success && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 hover:bg-inverse-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
          >
            {downloading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                Téléchargement...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">download</span>
                Télécharger l&apos;épreuve
              </>
            )}
          </button>
        )}

        {/* Séparateur */}
        <div className="border-t border-outline-variant my-8" />

        {/* Upsell : création de compte */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6">
          <h2 className="font-headline-sm text-primary mb-2">
            Créer un compte gratuit
          </h2>
          <p className="font-body-sm text-on-surface-variant mb-5">
            Retrouvez tous vos achats et votre historique de téléchargement
            en créant un compte. C&apos;est gratuit et instantané.
          </p>
          <Link
            href="/inscription"
            className="w-full border border-primary text-primary font-label-caps text-label-caps py-3 hover:bg-surface-container transition-colors inline-flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Créer mon compte
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TelechargementPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap text-center">
          <div className="animate-pulse">
            <div className="h-10 bg-surface-variant w-1/3 mx-auto mb-4" />
            <div className="h-6 bg-surface-variant w-1/2 mx-auto" />
          </div>
        </div>
      }
    >
      <TelechargementContent />
    </Suspense>
  );
}
