"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/features/auth/actions/auth.actions";
import type { AuthResult } from "@/features/auth/actions/auth.actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<AuthResult | null, FormData>(
    loginAction,
    null
  );

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="font-headline-md text-primary mb-3">Connexion</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Entrez vos identifiants pour acceder a votre compte.
        </p>
      </div>

      <form action={formAction} className="space-y-stack-lg">
        {state && !state.success && (
          <div className="bg-error-container text-on-error-container font-body-sm text-body-sm p-3 border border-error/30">
            {state.error}
          </div>
        )}

        {/* Email */}
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

        {/* Password */}
        <div className="relative pt-2">
          <div className="flex justify-between items-baseline mb-2">
            <label
              htmlFor="password"
              className="font-label-caps text-label-caps text-on-surface block"
            >
              Mot de passe
            </label>
            <Link
              href="/mot-de-passe-oublie"
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors underline decoration-transparent hover:decoration-primary/30 underline-offset-4"
            >
              Mot de passe oublie ?
            </Link>
          </div>
          <input
            id="password"
            name="password"
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
            {isPending ? "Connexion en cours..." : "Se connecter"}
            <span className="material-symbols-outlined text-[18px] opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Register link */}
        <div className="text-center pt-4">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Pas encore de compte ?{" "}
          </span>
          <Link
            href="/inscription"
            className="font-body-sm text-body-sm text-primary font-medium hover:text-secondary transition-colors underline decoration-primary/30 hover:decoration-secondary underline-offset-4"
          >
            Creer un compte
          </Link>
        </div>
      </form>
    </>
  );
}
