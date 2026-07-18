import { prisma } from "@/lib/prisma";

export const cartRepository = {
  findByUser(userId: string) {
    return prisma.cartItem.findMany({
      where: { userId },
      include: {
        examPaper: {
          include: {
            competition: true,
            subject: true,
            author: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findItem(userId: string, examPaperId: string) {
    return prisma.cartItem.findUnique({
      where: { userId_examPaperId: { userId, examPaperId } },
    });
  },

  add(userId: string, examPaperId: string, withCorrection = false) {
    return prisma.cartItem.upsert({
      where: { userId_examPaperId: { userId, examPaperId } },
      update: { withCorrection },
      create: { userId, examPaperId, withCorrection },
    });
  },

  update(userId: string, examPaperId: string, withCorrection: boolean) {
    return prisma.cartItem.update({
      where: { userId_examPaperId: { userId, examPaperId } },
      data: { withCorrection },
    });
  },

  remove(userId: string, examPaperId: string) {
    return prisma.cartItem.delete({
      where: { userId_examPaperId: { userId, examPaperId } },
    });
  },

  clear(userId: string) {
    return prisma.cartItem.deleteMany({ where: { userId } });
  },

  count(userId: string) {
    return prisma.cartItem.count({ where: { userId } });
  },
};
