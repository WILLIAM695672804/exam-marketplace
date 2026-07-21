/**
 * Repository d'accès aux données de la table Order pour le module paiement.
 *
 * Responsabilité unique : lire et écrire des commandes dans PostgreSQL via Prisma
 * pour les besoins spécifiques du flux de paiement.
 *
 * Distinct du order.repository.ts dans features/orders/ qui gère le cycle de vie
 * général des commandes (création depuis le panier, etc.).
 */

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class PaymentOrderRepository {
  private readonly db = prisma.order;

  // -----------------------------------------------------------------------
  // Lectures
  // -----------------------------------------------------------------------

  /**
   * Recherche une commande par son ID.
   *
   * @param id UUID de la commande.
   * @returns La commande ou null.
   */
  async findById(id: string) {
    return this.db.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });
  }

  /**
   * Recherche une commande par son numéro (order.number).
   *
   * @param number Numéro de commande (ex: "ORD-XXX-YYY").
   * @returns La commande ou null.
   */
  async findByNumber(number: string) {
    return this.db.findUnique({
      where: { number },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        transactions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
  }

  /**
   * Recherche une commande avec ses items, utile pour le calcul des commissions.
   * Chaque item contient les informations nécessaires (auteur, prix, épreuve).
   *
   * @param id UUID de la commande.
   * @returns La commande avec ses items ou null.
   */
  async findWithItems(id: string) {
    return this.db.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: {
          include: {
            examPaper: {
              select: {
                id: true,
                title: true,
                authorId: true,
              },
            },
          },
        },
        transactions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
  }

  // -----------------------------------------------------------------------
  // Transitions d'état (écritures atomiques)
  // -----------------------------------------------------------------------

  /**
   * Marque la commande comme payée.
   * Appelé après traitement réussi du webhook (Transaction SUCCESS).
   *
   * @param id UUID de la commande.
   * @returns La commande mise à jour.
   */
  async markPaid(id: string) {
    return this.db.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });
  }

  /**
   * Marque la commande comme annulée.
   * Appelé après échec de paiement (webhook FAILED ou annulation volontaire).
   *
   * @param id UUID de la commande.
   * @returns La commande mise à jour.
   */
  async markCancelled(id: string) {
    return this.db.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });
  }

  /**
   * Marque la commande comme expirée.
   * Appelé après timeout de 30 minutes sans paiement.
   *
   * @param id UUID de la commande.
   * @returns La commande mise à jour.
   */
  async markExpired(id: string) {
    return this.db.update({
      where: { id },
      data: {
        status: "EXPIRED",
      },
    });
  }

  // -----------------------------------------------------------------------
  // Vérifications
  // -----------------------------------------------------------------------

  /**
   * Vérifie que la commande appartient bien à l'utilisateur.
   * Utilisé par le guard anti-usurpation.
   *
   * @param orderId UUID de la commande.
   * @param userId UUID de l'utilisateur.
   * @returns true si la commande appartient à l'utilisateur.
   */
  async belongsToUser(
    orderId: string,
    userId: string
  ): Promise<boolean> {
    const count = await this.db.count({
      where: { id: orderId, userId },
    });
    return count > 0;
  }
}
