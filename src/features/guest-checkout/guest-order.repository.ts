/**
 * Repository pour les commandes invitées.
 *
 * Responsabilité : lire et écrire des commandes invitées (ownerType = "GUEST").
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuestOrderCreateInput {
  examPaperId: string;
  email: string;
  withCorrection: boolean;
}

export interface GuestOrderWithItems {
  id: string;
  number: string;
  ownerType: "USER" | "GUEST";
  guestEmail: string | null;
  totalAmount: Prisma.Decimal;
  status: string;
  items: {
    id: string;
    examPaperId: string;
    price: Prisma.Decimal;
    withCorrection: boolean;
    titleSnapshot: string;
    yearSnapshot: number;
    examPaper: {
      id: string;
      title: string;
      slug: string;
      paperFileId: string;
      correctionFileId: string | null;
    };
  }[];
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class GuestOrderRepository {
  /**
   * Génère un numéro de commande unique.
   */
  generateNumber(): string {
    return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  /**
   * Crée une commande invité pour une épreuve achetée directement.
   * Pas de panier : l'utilisateur achète une seule épreuve.
   */
  async createGuestOrder(input: GuestOrderCreateInput) {
    const examPaper = await prisma.examPaper.findUnique({
      where: { id: input.examPaperId },
    });

    if (!examPaper || examPaper.status !== "PUBLISHED") {
      throw new Error("Épreuve introuvable ou non disponible.");
    }

    const price =
      input.withCorrection && examPaper.priceWithCorrection
        ? examPaper.priceWithCorrection
        : examPaper.price;

    const order = await prisma.order.create({
      data: {
        number: this.generateNumber(),
        ownerType: "GUEST",
        guestEmail: input.email,
        userId: null,
        totalAmount: price,
        status: "PENDING",
        items: {
          create: {
            examPaperId: input.examPaperId,
            price,
            withCorrection: input.withCorrection,
            titleSnapshot: examPaper.title,
            yearSnapshot: examPaper.year,
            authorSnapshot: examPaper.professorName ?? "",
          },
        },
      },
      include: {
        items: {
          include: {
            examPaper: {
              select: {
                id: true,
                title: true,
                slug: true,
                paperFileId: true,
                correctionFileId: true,
              },
            },
          },
        },
      },
    });

    return order;
  }

  /**
   * Récupère une commande avec ses items et les infos de l'épreuve.
   */
  async findById(id: string): Promise<GuestOrderWithItems | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            examPaper: {
              select: {
                id: true,
                title: true,
                slug: true,
                paperFileId: true,
                correctionFileId: true,
              },
            },
          },
        },
      },
    }) as Promise<GuestOrderWithItems | null>;
  }

  /**
   * Recherche les commandes d'un invité par email.
   */
  async findByGuestEmail(email: string) {
    return prisma.order.findMany({
      where: { guestEmail: email, ownerType: "GUEST" },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Rattache les commandes invitées à un utilisateur nouvellement créé.
   *
   * @param email L'email de l'invité.
   * @param userId L'ID du nouvel utilisateur.
   * @returns Le nombre de commandes migrées.
   */
  async migrateToUser(email: string, userId: string): Promise<number> {
    const result = await prisma.order.updateMany({
      where: {
        guestEmail: email,
        ownerType: "GUEST",
      },
      data: {
        userId,
        ownerType: "USER",
        guestEmail: null,
      },
    });

    return result.count;
  }
}
