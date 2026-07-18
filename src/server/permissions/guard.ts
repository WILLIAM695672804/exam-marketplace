import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/config/roles";

/**
 * Etend le type Session pour inclure les roles.
 */
type SessionWithRoles = {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
};

/**
 * Recupere la session utilisateur avec les roles ou redirige vers la connexion.
 */
export async function getSessionOrRedirect(): Promise<SessionWithRoles> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/connexion");
  }
  return session as unknown as SessionWithRoles;
}

/**
 * Verifie que l'utilisateur connecte possede au moins un des roles requis.
 * Redirige vers /dashboard si le role est insuffisant.
 */
export async function requireRole(requiredRoles: Role | Role[]) {
  const session = await getSessionOrRedirect();
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const userRoles: string[] = session.user.roles ?? [];

  const hasRole = roles.some((r) => userRoles.includes(r));

  if (!hasRole) {
    redirect("/dashboard");
  }

  return { session, userRoles };
}

/**
 * Verifie si l'utilisateur connecte possede un role (sans redirection).
 */
export async function hasRole(role: Role): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const userRoles: string[] = (session.user as { roles?: string[] }).roles ?? [];
  return userRoles.includes(role);
}
