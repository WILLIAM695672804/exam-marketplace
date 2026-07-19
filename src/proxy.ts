import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes accessibles sans authentification
const publicPaths = [
  "/",
  "/catalogue",
  "/epreuve",
  "/categories",
  "/concours",
  "/matieres",
  "/contact",
  "/a-propos",
  "/faq",
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialisation",
  "/verifier-email",
  "/api",
  "/_next",
  "/favicon.ico",
];

export default function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Verifier si c'est une route publique
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  // Verifier le cookie de session Auth.js v5 (JWT strategy)
  // En dev: authjs.session-token, next-auth.session-token
  // En prod HTTPS: __Secure-authjs.session-token, __Secure-next-auth.session-token
  const authCookie =
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  if (!authCookie?.value) {
    const signInUrl = new URL("/connexion", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
