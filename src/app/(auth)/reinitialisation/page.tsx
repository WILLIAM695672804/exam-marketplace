"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/features/auth/actions/auth.actions";
import type { AuthResult } from "@/features/auth/actions/auth.actions";

export default function ReinitialisationPage() {
  const [state, formAction, isPending] = useActionState<AuthResult | null, FormData>(
    resetPasswordAction,
    null
  );

  if (state?.success) {
    return (
      <>
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-[48px] text-secondary mb-4 block">
            verified
          </span>
          <h1 className="font-headline-md text-primary mb-3">Mot de passe reinitialise</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Votre mot de passe a ete modifie avec succes.
          </p>
        </div>
        <div className="text-center pt-4">
          <Link
            href="/connexion"
            className="font-body-sm text-body-sm text-primary hover:text-secondary transition-colors underline decoration-primary/30 hover:decoration-secondary underline-offset-4"
          >
            Se connecter
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="font-headline-md text-primary mb-3">Reinitialiser le mot de passe</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
      </div>

      <form action={formAction} className="space-y-stack-lg">
        {state && !state.success && (
          <div className="bg-error-container text-on-error-container font-body-sm text-body-sm p-3 border border-error/30">
            {state.error}
          </div>
        )}

        {/* Token (hidden) — in real usage, this comes from the URL query param */}
        <input type="hidden" name="token" value="" />

        <div className="relative">
          <label
            htmlFor="password"
            className="font-label-caps text-label-caps text-on-surface block mb-2"
          >
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full bg-transparent border-0 border-b border-outline-variant/60 py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors placeholder:text-outline-variant outline-none"
          />
        </div>

        <div className="relative pt-2">
          <label
            htmlFor="confirmPassword"
            className="font-label-caps text-label-caps text-on-surface block mb-2"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            className="w-full bg-transparent border-0 border-b border-outline-variant/60 py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors placeholder:text-outline-variant outline-none"
          />
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 hover:bg-inverse-surface transition-colors disabled:opacity-70"
          >
            {isPending ? "Reinitialisation..." : "Reinitialiser le mot de passe"}
          </button>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/connexion"
            className="font-body-sm text-body-sm text-primary hover:text-secondary transition-colors underline decoration-primary/30 hover:decoration-secondary underline-offset-4"
          >
            Retour a la connexion
          </Link>
        </div>
      </form>
    </>
  );
}
