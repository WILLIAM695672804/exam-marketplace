import { prisma } from "@/lib/prisma";

export const reviewRepository = {
  create(orderItemId: string, rating: number, comment?: string) {
    return prisma.review.create({
      data: { orderItemId, rating, comment },
    });
  },

  findByExam(examPaperId: string) {
    return prisma.review.findMany({
      where: { orderItem: { examPaperId } },
      include: {
        orderItem: {
          include: { order: { select: { user: { select: { firstName: true, lastName: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getAverageRating(examPaperId: string) {
    return prisma.review.aggregate({
      where: { orderItem: { examPaperId } },
      _avg: { rating: true },
      _count: { rating: true },
    });
  },
};
