"use client";

import { useState, useCallback } from "react";

interface GuestCheckoutModalProps {
  open: boolean;
  examPaperId: string;
  examTitle: string;
  examPrice: number;
  withCorrection: boolean;
  onClose: () => void;
}

export function GuestCheckoutModal({
  open,
  examPaperId,
  examTitle,
  examPrice,
  withCorrection,
  onClose,
}: GuestCheckoutModalProps) {
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Callback ref : ouvre le dialog natif au montage dans le DOM
  const dialogRef = useCallback((node: HTMLDialogElement | null) => {
    if (node && !node.open) {
      node.showModal();
    }
  }, []);

  function handleClose() {
    setEmail("");
    setAccepted(false);
    setError("");
    setLoading(false);
    onClose();
  }

  function generateIdempotencyKey(): string {
    return `guest-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez saisir une adresse email valide.");
      return;
    }

    if (!accepted) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setLoading(true);

    try {
      // Étape 1 : Créer la commande invité
      const orderRes = await fetch("/api/orders/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examPaperId,
          email: email.trim().toLowerCase(),
          withCorrection,
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error || "Erreur lors de la création de la commande.");
      }

      const order = await orderRes.json();
      const idempotencyKey = generateIdempotencyKey();

      // Étape 2 : Initier le paiement
      const paymentRes = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          idempotencyKey,
        }),
      });

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok || !paymentData.success) {
        throw new Error(paymentData.error?.message || "Erreur lors de l'initiation du paiement.");
      }

      // Étape 3 : Rediriger vers Fapshi ou afficher l'erreur
      if (paymentData.data?.status === "FAILED") {
        const raison = paymentData.data?.errorMessage || "";
        throw new Error(
          `Le paiement a été refusé par le prestataire.${raison ? ` (${raison})` : ""}`
        );
      }

      if (paymentData.data?.paymentUrl) {
        window.location.href = paymentData.data.paymentUrl;
      } else {
        throw new Error(
          "Le service de paiement est momentanément indisponible. Réessayez dans quelques instants."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="fixed inset-0 z-50 bg-transparent backdrop:bg-primary/40 backdrop:backdrop-blur-sm open:flex items-center justify-center"
      style={{
        margin: "auto",
        border: "none",
        padding: 0,
        background: "transparent",
        maxWidth: "100vw",
        maxHeight: "100vh",
      }}
    >
      <div className="bg-surface-container-lowest border border-outline-variant p-8 max-w-[440px] w-full shadow-none">
        <h2 className="font-headline-sm text-primary mb-2">Acheter sans compte</h2>
        <p className="font-body-sm text-on-surface-variant mb-6">
          {examTitle} — {examPrice.toLocaleString()} FCFA
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="guest-email"
              className="font-label-caps text-label-caps text-on-surface-variant block mb-2"
            >
              Adresse e-mail
            </label>
            <input
              id="guest-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@email.com"
              required
              className="w-full border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-primary placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Conditions */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 border-outline-variant text-primary focus:ring-primary w-4 h-4"
            />
            <span className="font-body-sm text-on-surface-variant">
              J&apos;accepte les conditions d&apos;utilisation
            </span>
          </label>

          {/* Erreur */}
          {error && (
            <p className="font-body-sm text-error bg-error/10 p-3 border border-error/20">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 hover:bg-inverse-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                Préparation du paiement...
              </>
            ) : (
              <>
                Continuer vers le paiement
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>

          <p className="text-center font-body-sm text-on-surface-variant flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Paiement sécurisé via Fapshi
          </p>
        </form>
      </div>
    </dialog>
  );
}
