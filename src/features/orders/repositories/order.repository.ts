import { prisma } from "@/lib/prisma";

export const orderRepository = {
  generateNumber(): string {
    return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  },

  findByUser(userId: string, status?: string) {
    return prisma.order.findMany({
      where: { userId, ...(status ? { status: status as "PENDING" | "PAID" | "CANCELLED" } : {}) },
      include: {
        items: {
          include: {
            examPaper: { select: { title: true, slug: true } },
            downloads: true,
            review: true,
          },
        },
        transactions: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            examPaper: {
              select: { title: true, slug: true, paperFileId: true, correctionFileId: true },
            },
            downloads: true,
          },
        },
        transactions: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  },

  findByNumber(number: string) {
    return prisma.order.findUnique({
      where: { number },
      include: { items: true, transactions: true },
    });
  },

  async createFromCart(userId: string, ownerType: "USER" | "GUEST" = "USER") {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { examPaper: true },
    });

    if (cartItems.length === 0) {
      throw new Error("Le panier est vide");
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      const price =
        item.withCorrection && item.examPaper.priceWithCorrection
          ? Number(item.examPaper.priceWithCorrection)
          : Number(item.examPaper.price);
      return sum + price;
    }, 0);

    const order = await prisma.order.create({
      data: {
        number: this.generateNumber(),
        ownerType,
        userId,
        totalAmount,
        items: {
          create: cartItems.map((item) => ({
            examPaperId: item.examPaperId,
            price:
              item.withCorrection && item.examPaper.priceWithCorrection
                ? item.examPaper.priceWithCorrection
                : item.examPaper.price,
            withCorrection: item.withCorrection,
            titleSnapshot: item.examPaper.title,
            yearSnapshot: item.examPaper.year,
            authorSnapshot: "",
          })),
        },
      },
      include: { items: true },
    });

    // Vider le panier
    await prisma.cartItem.deleteMany({ where: { userId } });

    return order;
  },
};
