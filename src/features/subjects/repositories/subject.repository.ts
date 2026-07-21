import { prisma } from "@/lib/prisma";

export const subjectRepository = {
  findAll(competitionId?: string) {
    return prisma.subject.findMany({
      where: { deletedAt: null, ...(competitionId ? { competitionId } : {}) },
      include: { competition: true, _count: { select: { examPapers: true } } },
      orderBy: { name: "asc" },
    });
  },

  findBySlug(slug: string) {
    return prisma.subject.findFirst({
      where: { slug, deletedAt: null },
      include: { competition: { include: { category: true } } },
    });
  },

  create(data: { name: string; slug: string; competitionId: string }) {
    return prisma.subject.create({
      data,
      include: { competition: true, _count: { select: { examPapers: true } } },
    });
  },

  update(id: string, data: { name?: string; slug?: string }) {
    return prisma.subject.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.subject.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
