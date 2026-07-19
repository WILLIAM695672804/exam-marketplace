"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/features/auth/actions/auth.actions";
import type { AuthResult } from "@/features/auth/actions/auth.actions";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<AuthResult | null, FormData>(
    registerAction,
    null
  );

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="font-headline-md text-primary mb-3">Inscription</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Creez votre compte pour acceder a la plateforme.
        </p>
      </div>

      <form action={formAction} className="space-y-stack-lg">
        {state && !state.success && (
          <div className="bg-error-container text-on-error-container font-body-sm text-body-sm p-3 border border-error/30">
            {state.error}
          </div>
        )}

        {/* First Name */}
        <div className="relative">
          <label
            htmlFor="firstName"
            className="font-label-caps text-label-caps text-on-surface block mb-2"
          >
            Prenom
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            placeholder="Jean"
            className="w-full bg-transparent border-0 border-b border-outline-variant/60 py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors placeholder:text-outline-variant outline-none"
          />
        </div>

        {/* Last Name */}
        <div className="relative pt-2">
          <label
            htmlFor="lastName"
            className="font-label-caps text-label-caps text-on-surface block mb-2"
          >
            Nom
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            placeholder="Dupont"
            className="w-full bg-transparent border-0 border-b border-outline-variant/60 py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors placeholder:text-outline-variant outline-none"
          />
        </div>

        {/* Email */}
        <div className="relative pt-2">
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

        {/* Password */}
        <div className="relative pt-2">
          <label
            htmlFor="password"
            className="font-label-caps text-label-caps text-on-surface block mb-2"
          >
            Mot de passe
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

        {/* Confirm Password */}
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

        {/* Submit */}
        <div className="pt-8">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 hover:bg-inverse-surface transition-colors flex justify-center items-center gap-2 group disabled:opacity-70"
          >
            {isPending ? "Creation en cours..." : "Creer un compte"}
            <span className="material-symbols-outlined text-[18px] opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Login link */}
        <div className="text-center pt-4">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Deja un compte ?{" "}
          </span>
          <Link
            href="/connexion"
            className="font-body-sm text-body-sm text-primary font-medium hover:text-secondary transition-colors underline decoration-primary/30 hover:decoration-secondary underline-offset-4"
          >
            Se connecter
          </Link>
        </div>
      </form>
    </>
  );
}
