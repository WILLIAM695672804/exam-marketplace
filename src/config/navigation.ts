import type { Role } from "@/config/roles";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  roles?: Role[];
  children?: NavItem[];
  badge?: string;
}

export const publicNavigation: NavItem[] = [
  { label: "Catalogue", href: "/catalogue" },
  { label: "Catégories", href: "/categories" },
  { label: "Concours", href: "/concours" },
  { label: "Matières", href: "/matieres" },
  { label: "Contact", href: "/contact" },
  { label: "À propos", href: "/a-propos" },
];

export const dashboardNavigation: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    label: "Commandes",
    href: "/dashboard/commandes",
    icon: "ShoppingBag",
    roles: ["BUYER"],
  },
  {
    label: "Téléchargements",
    href: "/dashboard/telechargements",
    icon: "Download",
    roles: ["BUYER"],
  },
  {
    label: "Panier",
    href: "/dashboard/panier",
    icon: "ShoppingCart",
    roles: ["BUYER"],
  },
  {
    label: "Favoris",
    href: "/dashboard/favoris",
    icon: "Heart",
    roles: ["BUYER"],
  },
  {
    label: "Mes épreuves",
    href: "/dashboard/mes-epreuves",
    icon: "FileText",
    roles: ["TEACHER"],
  },
  {
    label: "Publier une épreuve",
    href: "/dashboard/publier",
    icon: "PlusCircle",
    roles: ["TEACHER"],
  },
  {
    label: "Demandes enseignants",
    href: "/dashboard/demandes",
    icon: "UserCheck",
    roles: ["ADMIN"],
  },
  {
    label: "Utilisateurs",
    href: "/dashboard/utilisateurs",
    icon: "Users",
    roles: ["ADMIN"],
  },
  {
    label: "Statistiques",
    href: "/dashboard/statistiques",
    icon: "BarChart3",
    roles: ["ADMIN"],
  },
  {
    label: "Paramètres",
    href: "/dashboard/parametres",
    icon: "Settings",
  },
  {
    label: "Profil",
    href: "/dashboard/profil",
    icon: "User",
  },
];
