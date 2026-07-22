/**
 * Service de checkout invité.
 *
 * Orchestre le flux d'achat sans compte :
 *   1. Création de la commande invité
 *   2. Initiation du paiement (via PaymentService)
 *   3. Génération des liens de téléchargement signés
 *   4. Rattachement des commandes lors de l'inscription
 */

import type { PaymentService } from "@/features/payments/services/payment.service";
import type { PaymentCustomer } from "@/features/payments/types/payment-customer";
import { GuestOrderRepository } from "./guest-order.repository";
import { generateDownloadToken } from "./download-token";
import type { GuestOrderWithItems } from "./guest-order.repository";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DownloadLink {
  label: string;
  url: string;
  type: "paper" | "correction";
}

export interface GuestCheckoutResult {
  order: GuestOrderWithItems;
  paymentUrl: string;
  transactionId: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class GuestCheckoutService {
  constructor(
    private readonly orderRepo: GuestOrderRepository,
    private readonly paymentService: PaymentService
  ) {}

  // -----------------------------------------------------------------------
  // Création de commande
  // -----------------------------------------------------------------------

  /**
   * Crée une commande invité pour un achat direct.
   * Pas de panier : l'invité achète une épreuve immédiatement.
   */
  async createOrder(input: {
    examPaperId: string;
    email: string;
    withCorrection: boolean;
  }) {
    return this.orderRepo.createGuestOrder(input);
  }

  // -----------------------------------------------------------------------
  // Paiement
  // -----------------------------------------------------------------------

  /**
   * Initie le paiement pour une commande invité.
   * Construit un PaymentCustomer GUEST et délègue à PaymentService.
   */
  async initiatePayment(
    orderId: string,
    email: string,
    idempotencyKey: string,
    ip?: string,
    ua?: string
  ) {
    const customer: PaymentCustomer = {
      ownerType: "GUEST",
      email,
    };

    return this.paymentService.initiate(
      { orderId, idempotencyKey },
      customer,
      ip,
      ua
    );
  }

  // -----------------------------------------------------------------------
  // Liens de téléchargement
  // -----------------------------------------------------------------------

  /**
   * Génère les liens de téléchargement signés pour tous les items d'une commande.
   * Un item peut avoir 1 ou 2 liens (paper + correction).
   */
  async generateDownloadLinks(order: GuestOrderWithItems): Promise<DownloadLink[]> {
    const links: DownloadLink[] = [];

    for (const item of order.items) {
      const email = order.guestEmail;
      if (!email) continue;

      // Lien pour l'épreuve
      const paperToken = await generateDownloadToken({
        orderId: order.id,
        orderItemId: item.id,
        email,
        type: "paper",
      });

      links.push({
        label: `${item.titleSnapshot} (${item.yearSnapshot}) — Épreuve`,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/telechargement?token=${paperToken}`,
        type: "paper",
      });

      // Lien pour le corrigé (si disponible)
      if (item.withCorrection && item.examPaper.correctionFileId) {
        const correctionToken = await generateDownloadToken({
          orderId: order.id,
          orderItemId: item.id,
          email,
          type: "correction",
        });

        links.push({
          label: `${item.titleSnapshot} (${item.yearSnapshot}) — Corrigé`,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/telechargement?token=${correctionToken}`,
          type: "correction",
        });
      }
    }

    return links;
  }

  // -----------------------------------------------------------------------
  // Rattachement post-inscription
  // -----------------------------------------------------------------------

  /**
   * Rattache toutes les commandes invitées d'un email à un utilisateur.
   * Appelé après l'inscription (depuis la route register, pas depuis AuthService).
   *
   * @param email L'email utilisé lors des achats invités.
   * @param userId L'ID du compte nouvellement créé.
   * @returns Le nombre de commandes migrées.
   */
  async migrateGuestOrders(email: string, userId: string): Promise<number> {
    return this.orderRepo.migrateToUser(email, userId);
  }
}
