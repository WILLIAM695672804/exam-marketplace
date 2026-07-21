import { prisma } from "@/lib/prisma";

export const competitionRepository = {
  findAll(categoryId?: string) {
    return prisma.competition.findMany({
      where: { deletedAt: null, ...(categoryId ? { categoryId } : {}) },
      include: { category: true, _count: { select: { subjects: true, examPapers: true } } },
      orderBy: { name: "asc" },
    });
  },

  findBySlug(slug: string) {
    return prisma.competition.findFirst({
      where: { slug, deletedAt: null },
      include: { category: true, subjects: { where: { deletedAt: null } } },
    });
  },

  create(data: { name: string; slug: string; categoryId: string; organisme?: string }) {
    return prisma.competition.create({
      data,
      include: { category: true, _count: { select: { subjects: true, examPapers: true } } },
    });
  },

  update(id: string, data: { name?: string; slug?: string; organisme?: string }) {
    return prisma.competition.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.competition.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
