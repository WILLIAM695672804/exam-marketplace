import type { NextAuthConfig } from "next-auth";

// Configuration partagée d'Auth.js
// Ce fichier est importé par auth.ts et par le middleware

export const authConfig = {
  pages: {
    signIn: "/connexion",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Rediriger vers /connexion
      }

      return true;
    },
  },
  providers: [], // Configuré dans auth.ts
} satisfies NextAuthConfig;
