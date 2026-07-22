/**
 * Représente un client effectuant un paiement.
 *
 * Cette abstraction permet à PaymentService de traiter indifféremment
 * un utilisateur connecté ou un invité, sans jamais connaître Auth.js.
 */

export interface PaymentCustomer {
  /** Type de propriétaire de la commande. */
  ownerType: "USER" | "GUEST";

  /** Email du client (obligatoire pour les deux types). */
  email: string;

  /** Téléphone (optionnel). */
  phone?: string | null;

  /** Nom complet (optionnel). */
  name?: string;

  /** ID de l'utilisateur connecté (présent uniquement si ownerType === "USER"). */
  userId?: string;
}
