"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/features/auth/actions/auth.actions";
import type { AuthResult } from "@/features/auth/actions/auth.actions";

export default function MotDePasseOubliePage() {
  const [state, formAction, isPending] = useActionState<AuthResult | null, FormData>(
    forgotPasswordAction,
    null
  );

  if (state?.success) {
    return (
      <>
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-[48px] text-secondary mb-4 block">
            mark_email_read
          </span>
          <h1 className="font-headline-md text-primary mb-3">Email envoye</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Si un compte existe avec cette adresse, vous recevrez un email contenant un lien de
            reinitialisation. Verifiez vos spams.
          </p>
        </div>
        <div className="text-center pt-4">
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

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="font-headline-md text-primary mb-3">Mot de passe oublie</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Entrez votre adresse email pour recevoir un lien de reinitialisation.
        </p>
      </div>

      <form action={formAction} className="space-y-stack-lg">
        {state && !state.success && (
          <div className="bg-error-container text-on-error-container font-body-sm text-body-sm p-3 border border-error/30">
            {state.error}
          </div>
        )}

        <div className="relative">
          <label
            htmlFor="email"
            className="font-label-caps text-label-caps text-on-surface block mb-2"
          >
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="nom@institution.edu"
            className="w-full bg-transparent border-0 border-b border-outline-variant/60 py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors placeholder:text-outline-variant outline-none"
          />
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 hover:bg-inverse-surface transition-colors disabled:opacity-70"
          >
            {isPending ? "Envoi en cours..." : "Envoyer le lien de reinitialisation"}
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
