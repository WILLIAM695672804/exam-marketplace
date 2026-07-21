import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un prix en FCFA (franc CFA camerounais).
 * Ex: 1500 → "1 500 FCFA"
 */
export function formatPrice(price: number | string | { toString: () => string }): string {
  const num = Number(price);
  return `${num.toLocaleString("fr-FR").replace(/\s/g, " ")} FCFA`;
}
