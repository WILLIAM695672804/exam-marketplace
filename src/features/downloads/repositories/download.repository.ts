import { prisma } from "@/lib/prisma";

export const downloadRepository = {
  async canDownload(userId: string, examPaperId: string): Promise<boolean> {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        examPaperId,
        order: { userId, status: "PAID" },
      },
      include: { downloads: true, order: true },
    });

    if (!orderItem) return false;

    const maxDownloads = 5;
    return orderItem.downloads.length < maxDownloads;
  },

  async recordDownload(
    userId: string,
    orderItemId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return prisma.download.create({
      data: { userId, orderItemId, ipAddress, userAgent },
    });
  },

  async findByUser(userId: string) {
    return prisma.download.findMany({
      where: { userId },
      include: {
        orderItem: {
          include: {
            examPaper: {
              select: { title: true, slug: true, paperFileId: true, correctionFileId: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
