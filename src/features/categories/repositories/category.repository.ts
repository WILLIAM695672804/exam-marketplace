import { prisma } from "@/lib/prisma";

export const categoryRepository = {
  findAll() {
    return prisma.category.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { competitions: true } } },
      orderBy: { name: "asc" },
    });
  },

  findBySlug(slug: string) {
    return prisma.category.findFirst({
      where: { slug, deletedAt: null },
      include: { competitions: { where: { deletedAt: null } } },
    });
  },

  create(data: { name: string; slug: string; description?: string }) {
    return prisma.category.create({
      data,
      include: { _count: { select: { competitions: true } } },
    });
  },

  update(id: string, data: { name?: string; slug?: string; description?: string }) {
    return prisma.category.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
