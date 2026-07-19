import { resend } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const FROM_EMAIL = "ExamMarket <noreply@exammarketplace.com>";

export const mailService = {
  async sendOrderConfirmation(userId: string, orderId: string) {
    if (!resend) return;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { examPaper: true } } },
    });

    if (!user || !order) return;

    const itemsList = order.items
      .map((item) => `- ${item.examPaper.title} (${item.price})`)
      .join("\n");

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: `Confirmation de commande ${order.number}`,
        text: `Bonjour ${user.firstName},\n\nVotre commande ${order.number} a ete confirmee.\n\nRecapitulatif :\n${itemsList}\n\nTotal : ${order.totalAmount} FCFA\n\nMerci de votre confiance !`,
      });

      await this.createNotification(
        userId,
        "PAYMENT",
        "Commande confirmee",
        `Votre commande ${order.number} a ete payee avec succes.`
      );
    } catch (error) {
      logger.error({ error, userId, orderId }, "Erreur envoi email confirmation");
    }
  },

  async sendTeacherValidation(userId: string, approved: boolean, reason?: string) {
    if (!resend) return;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: approved
          ? "Accreditation enseignant approuvee"
          : "Accreditation enseignant refusee",
        text: approved
          ? `Bonjour ${user.firstName},\n\nVotre demande d'accreditation enseignant a ete approuvee. Vous pouvez maintenant publier vos epreuves sur la plateforme.`
          : `Bonjour ${user.firstName},\n\nVotre demande d'accreditation enseignant a ete refusee.\nRaison : ${reason || "Non specifiee"}`,
      });

      await this.createNotification(
        userId,
        approved ? "VALIDATION" : "REJECTION",
        approved ? "Accreditation approuvee" : "Accreditation refusee",
        approved
          ? "Vous pouvez maintenant publier des epreuves."
          : `Raison : ${reason || "Non specifiee"}`
      );
    } catch (error) {
      logger.error({ error, userId }, "Erreur envoi email validation enseignant");
    }
  },

  async sendPasswordReset(email: string, token: string) {
    if (!resend) return;

    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reinitialisation?token=${token}`;

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Reinitialisation de votre mot de passe",
        text: `Vous avez demande la reinitialisation de votre mot de passe.\n\nCliquez sur ce lien pour le reinitialiser : ${resetUrl}\n\nCe lien expire dans 1 heure.`,
      });
    } catch (error) {
      logger.error({ error, email }, "Erreur envoi email reset mot de passe");
    }
  },

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
