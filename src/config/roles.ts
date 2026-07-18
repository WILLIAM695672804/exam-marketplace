export const ROLES = {
  BUYER: "BUYER",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  BUYER: "Acheteur",
  TEACHER: "Enseignant",
  ADMIN: "Administrateur",
};
