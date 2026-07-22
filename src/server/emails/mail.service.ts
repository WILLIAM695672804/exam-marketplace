import { transporter } from "@/lib/mail-transport";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const FROM_EMAIL = env.MAIL_FROM;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DownloadLink {
  label: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mailService = {
  // -----------------------------------------------------------------------
  // Façade — dispatch automatique selon ownerType
  // -----------------------------------------------------------------------

  /**
   * Envoie l'email de confirmation de commande.
   * Dispatch automatiquement vers la méthode USER ou GUEST selon l'ownerType.
   */
  async sendOrderConfirmation(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { examPaper: true } },
        user: { select: { id: true, firstName: true, email: true } },
      },
    });

    if (!order) return;

    if (order.ownerType === "GUEST" && order.guestEmail) {
      // Les liens de téléchargement seront générés par l'appelant (webhook)
      // car ils nécessitent le generateDownloadToken qui n'est pas disponible ici.
      // On les passe en paramètre optionnel.
      await this.sendGuestOrderConfirmation(order.guestEmail, {
        number: order.number,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((item) => ({
          titleSnapshot: item.examPaper.title,
          yearSnapshot: item.examPaper.year,
          price: Number(item.price),
        })),
      });
    } else if (order.ownerType === "USER" && order.userId) {
      await this.sendUserOrderConfirmation(order.userId, orderId);
    }
  },

  // -----------------------------------------------------------------------
  // Utilisateur connecté
  // -----------------------------------------------------------------------

  async sendUserOrderConfirmation(userId: string, orderId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { examPaper: true } } },
    });

    if (!user || !order) return;

    const itemsList = order.items
      .map((item) => `- ${item.examPaper.title} (${item.price} FCFA)`)
      .join("\n");

    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to: user.email,
        subject: `Confirmation de commande ${order.number}`,
        text: `Bonjour ${user.firstName},\n\nVotre commande ${order.number} a été confirmée.\n\nRécapitulatif :\n${itemsList}\n\nTotal : ${order.totalAmount} FCFA\n\nMerci de votre confiance !`,
      });

      await this.createNotification(
        userId,
        "PAYMENT",
        "Commande confirmée",
        `Votre commande ${order.number} a été payée avec succès.`
      );
    } catch (error) {
      logger.error({ error, userId, orderId }, "Erreur envoi email confirmation");
    }
  },

  // -----------------------------------------------------------------------
  // Invité
  // -----------------------------------------------------------------------

  /**
   * Envoie l'email de confirmation à un acheteur invité.
   * Contient la facture + les liens de téléchargement signés.
   *
   * @param email Adresse email de l'acheteur invité.
   * @param order Commande avec ses items.
   * @param downloadLinks Liens de téléchargement signés (générés par GuestCheckoutService).
   */
  async sendGuestOrderConfirmation(
    email: string,
    order: {
      number: string;
      totalAmount: number;
      items: {
        titleSnapshot: string;
        yearSnapshot: number;
        price: number;
      }[];
    },
    downloadLinks?: DownloadLink[]
  ) {
    const itemsList = order.items
      .map((item) => `- ${item.titleSnapshot} (${item.yearSnapshot}) — ${item.price} FCFA`)
      .join("\n");

    const linksSection =
      downloadLinks && downloadLinks.length > 0
        ? `\nTéléchargez vos épreuves :\n${downloadLinks.map((l) => `${l.label} : ${l.url}`).join("\n")}\n\nCes liens sont personnels et expirent dans 7 jours.`
        : "";

    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to: email,
        subject: "Votre achat a été confirmé — Muppad",
        text: [
          "Bonjour,",
          "",
          "Merci pour votre achat sur Muppad.",
          "",
          "Votre paiement a été confirmé.",
          "",
          "Récapitulatif de votre commande :",
          itemsList,
          "",
          `Total : ${order.totalAmount} FCFA`,
          linksSection,
          "Merci de votre confiance.",
          "",
          "L'équipe Muppad",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (error) {
      logger.error({ error, email, orderId: order.number }, "Erreur envoi email confirmation invité");
    }
  },

  // -----------------------------------------------------------------------
  // Enseignant
  // -----------------------------------------------------------------------

  async sendTeacherValidation(userId: string, approved: boolean, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to: user.email,
        subject: approved
          ? "Accréditation enseignant approuvée"
          : "Accréditation enseignant refusée",
        text: approved
          ? `Bonjour ${user.firstName},\n\nVotre demande d'accréditation enseignant a été approuvée. Vous pouvez maintenant publier vos épreuves sur la plateforme.`
          : `Bonjour ${user.firstName},\n\nVotre demande d'accréditation enseignant a été refusée.\nRaison : ${reason || "Non spécifiée"}`,
      });

      await this.createNotification(
        userId,
        approved ? "VALIDATION" : "REJECTION",
        approved ? "Accréditation approuvée" : "Accréditation refusée",
        approved
          ? "Vous pouvez maintenant publier des épreuves."
          : `Raison : ${reason || "Non spécifiée"}`
      );
    } catch (error) {
      logger.error({ error, userId }, "Erreur envoi email validation enseignant");
    }
  },

  // -----------------------------------------------------------------------
  // Réinitialisation mot de passe
  // -----------------------------------------------------------------------

  async sendPasswordReset(email: string, token: string) {
    try {
      const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reinitialisation?token=${token}`;

      await transporter.sendMail({
        from: FROM_EMAIL,
        to: email,
        subject: "Réinitialisation de votre mot de passe",
        text: `Vous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien pour le réinitialiser : ${resetUrl}\n\nCe lien expire dans 1 heure.`,
      });
    } catch (error) {
      logger.error({ error, email }, "Erreur envoi email reset mot de passe");
    }
  },

  // -----------------------------------------------------------------------
  // Notification in-app
  // -----------------------------------------------------------------------

  async createNotification(
    userId: string,
    type: "PAYMENT" | "VALIDATION" | "REJECTION" | "SYSTEM",
    subject: string,
    content: string
  ) {
    return prisma.notification.create({
      data: { userId, type, channel: "IN_APP", subject, content },
    });
  },
};
