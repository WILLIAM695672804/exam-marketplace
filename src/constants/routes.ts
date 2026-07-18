export const ROUTES = {
  // Publiques
  HOME: "/",
  CATALOGUE: "/catalogue",
  EPREUVE: (slug: string) => `/epreuve/${slug}`,
  CATEGORIES: "/categories",
  CONCOURS: "/concours",
  MATIERES: "/matieres",
  CONTACT: "/contact",
  A_PROPOS: "/a-propos",
  FAQ: "/faq",

  // Auth
  CONNEXION: "/connexion",
  INSCRIPTION: "/inscription",
  MOT_DE_PASSE_OUBLIE: "/mot-de-passe-oublie",
  REINITIALISATION: "/reinitialisation",
  VERIFIER_EMAIL: "/verifier-email",

  // Dashboard
  DASHBOARD: "/dashboard",
  PROFIL: "/dashboard/profil",
  COMMANDES: "/dashboard/commandes",
  TELECHARGEMENTS: "/dashboard/telechargements",
  PANIER: "/dashboard/panier",
  FAVORIS: "/dashboard/favoris",
  NOTIFICATIONS: "/dashboard/notifications",
  PARAMETRES: "/dashboard/parametres",

  // Enseignant
  MES_EPREUVES: "/dashboard/mes-epreuves",
  PUBLIER: "/dashboard/publier",

  // Admin
  DEMANDES: "/dashboard/demandes",
  UTILISATEURS: "/dashboard/utilisateurs",
  STATISTIQUES: "/dashboard/statistiques",

  // API
  API: "/api",
} as const;
