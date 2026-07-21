"use client";

import { useEffect, useRef, useState, useCallback } from "react";

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
}

interface PaymentModalProps {
  paymentUrl: string;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({
  paymentUrl,
  orderId,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const popupRef = useRef<Window | null>(null);
  const [status, setStatus] = useState<"opening" | "pending" | "success" | "failed">("opening");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Ouvrir le popup Fapshi (desktop) ou rediriger (mobile)
  useEffect(() => {
    // Mobile → redirection pleine page (les popups ne marchent pas)
    if (isMobile()) {
      window.location.href = paymentUrl;
      return;
    }

    const w = 480;
    const h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    const popup = window.open(
      paymentUrl,
      "fapshi-payment",
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      // Popup bloqué → fallback: redirection pleine page
      window.location.href = paymentUrl;
      return;
    }

    popupRef.current = popup;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- changement d'état légitime dans un effet
    setStatus("pending");

    // Polling toutes les 3 secondes
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/verify?orderId=${orderId}`);
        if (!res.ok) return;
        const { data } = await res.json();
        if (data?.status === "SUCCESS" || data?.verified) {
          stopPolling();
          setStatus("success");
          // Fermer le popup
          popup.close();
          // Notifier le parent après un court délai (animation)
          setTimeout(() => onSuccess(), 800);
        }
      } catch {
        // Continuer le polling
      }
    }, 3000);

    // Vérifier si le popup est fermé manuellement
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        stopPolling();
        // Le popup a été fermé → l'utilisateur a peut-être payé ou annulé
        // On vérifie une dernière fois le statut
        fetch(`/api/payments/verify?orderId=${orderId}`)
          .then((res) => res.json())
          .then(({ data }) => {
            if (data?.status === "SUCCESS" || data?.verified) {
              setStatus("success");
              setTimeout(() => onSuccess(), 800);
            } else {
              setStatus("failed");
            }
          })
          .catch(() => setStatus("failed"));
      }
    }, 1000);

    return () => {
      stopPolling();
      clearInterval(checkClosed);
    };
  }, [paymentUrl, orderId, onSuccess, stopPolling]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-container-lowest border border-outline-variant w-full max-w-md mx-4 p-8">
        {status === "opening" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-body-lg text-primary">Redirection vers Fapshi...</p>
            <p className="font-body-sm text-on-surface-variant text-center">
              {isMobile()
                ? "Vous allez être redirigé vers la page de paiement."
                : "Une fenêtre de paiement Fapshi va s'ouvrir. Autorisez les popups si rien ne se passe."}
            </p>
          </div>
        )}

        {status === "pending" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-body-lg text-primary">Paiement en cours...</p>
            <p className="font-body-sm text-on-surface-variant text-center">
              Terminez votre paiement dans la fenêtre Fapshi.
              <br />
              Cette page se fermera automatiquement.
            </p>
            <button
              onClick={onClose}
              className="mt-4 border border-outline-variant text-on-surface-variant font-label-caps text-label-caps uppercase px-6 py-2 hover:bg-surface-container transition-colors"
            >
              Annuler
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <span className="material-symbols-outlined text-[48px] text-secondary">check_circle</span>
            <p className="font-headline-sm text-primary">Paiement confirmé !</p>
            <p className="font-body-sm text-on-surface-variant">Redirection vers vos commandes...</p>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <span className="material-symbols-outlined text-[48px] text-error">cancel</span>
            <p className="font-headline-sm text-primary">Paiement non confirmé</p>
            <p className="font-body-sm text-on-surface-variant text-center">
              Si vous avez effectué le paiement, il sera confirmé automatiquement.
            </p>
            <button
              onClick={onSuccess}
              className="mt-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase px-6 py-3 hover:bg-inverse-surface transition-colors"
            >
              Voir mes commandes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
