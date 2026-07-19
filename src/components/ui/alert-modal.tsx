"use client";

import { useEffect, useRef } from "react";

interface AlertModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export function AlertModal({ open, message, onClose }: AlertModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
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
      <div className="bg-surface-container-lowest border border-outline-variant p-10 max-w-[440px] w-full shadow-none">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-4 block">
            error_outline
          </span>
          <h2 className="font-headline-sm text-primary mb-3">Limite atteinte</h2>
          <p className="font-body-md text-on-surface-variant mb-8">{message}</p>
          <button
            onClick={onClose}
            className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-3 px-8 hover:bg-inverse-surface transition-colors"
          >
            Compris
          </button>
        </div>
      </div>
    </dialog>
  );
}
