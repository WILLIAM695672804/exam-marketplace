"use client";

import { useState } from "react";
import Link from "next/link";

export default function VerifierEmailPage() {
  const [resent, setResent] = useState(false);

  function handleResend() {
    setResent(true);
    // En production: appeler une Server Action qui renvoie l'email de verification
  }

  return (
    <>
      <div className="text-center mb-10">
        <span className="material-symbols-outlined text-[48px] text-secondary mb-4 block">
          mail
        </span>
        <h1 className="font-headline-md text-primary mb-3">Verifiez votre email</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Un email de verification a ete envoye a votre adresse. Cliquez sur le lien pour activer
          votre compte.
        </p>
      </div>

      <div className="text-center pt-4">
        {resent ? (
          <p className="font-body-sm text-secondary">Email renvoye.</p>
        ) : (
          <button
            onClick={handleResend}
            className="font-body-sm text-primary hover:text-secondary transition-colors underline decoration-primary/30 hover:decoration-secondary underline-offset-4"
          >
            Renvoyer l&apos;email
          </button>
        )}
      </div>

      <div className="text-center pt-6">
        <Link
          href="/connexion"
          className="font-body-sm text-body-sm text-primary hover:text-secondary transition-colors underline decoration-primary/30 hover:decoration-secondary underline-offset-4"
        >
          Retour a la connexion
        </Link>
      </div>
    </>
  );
}
