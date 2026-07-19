import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const examRepository = {
  async findAll(params: {
    search?: string;
    categoryId?: string;
    competitionId?: string;
    subjectId?: string;
    minPrice?: number;
    maxPrice?: number;
    authorId?: string;
    status?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      categoryId,
      competitionId,
      subjectId,
      minPrice,
      maxPrice,
      authorId,
      status,
      sortBy = "createdAt",
      page = 1,
      limit = 20,
    } = params;

    const where: Prisma.ExamPaperWhereInput = {
      deletedAt: null,
      ...(status && status !== "ALL" ? { status: status as "DRAFT" | "PUBLISHED" | "MASKED" } : {}),
      ...(authorId ? { authorId } : {}),
      ...(competitionId ? { competitionId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(categoryId ? { competition: { categoryId } } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { competition: { name: { contains: search, mode: "insensitive" } } },
              { subject: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.examPaper.findMany({
        where,
        include: {
          competition: { include: { category: true } },
          subject: true,
          author: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy:
          sortBy === "price_asc"
            ? { price: "asc" }
            : sortBy === "price_desc"
              ? { price: "desc" }
              : sortBy === "year"
                ? { year: "desc" }
                : { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.examPaper.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  },

  findBySlug(slug: string) {
    return prisma.examPaper.findFirst({
      where: { slug, deletedAt: null },
      include: {
        competition: { include: { category: true } },
        subject: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        paperFile: true,
        correctionFile: true,
        orderItems: { include: { review: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.examPaper.findUnique({
      where: { id },
      include: {
        competition: { include: { category: true } },
        subject: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        paperFile: true,
        correctionFile: true,
      },
    });
  },

  create(data: {
    title: string;
    slug: string;
    year: number;
    price: number;
    priceWithCorrection?: number;
    authorId: string;
    competitionId: string;
    subjectId: string;
    paperFileId: string;
    correctionFileId?: string;
    professorName?: string;
    professorPhone?: string;
    status?: "DRAFT" | "PUBLISHED";
    publishedAt?: Date;
  }) {
    return prisma.examPaper.create({ data });
  },

  update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      year?: number;
      price?: number;
      priceWithCorrection?: number;
      status?: "DRAFT" | "PUBLISHED" | "MASKED";
      competitionId?: string;
      subjectId?: string;
      paperFileId?: string;
      correctionFileId?: string;
      professorName?: string;
      professorPhone?: string;
      publishedAt?: Date;
    }
  ) {
    return prisma.examPaper.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.examPaper.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  mask(id: string) {
    return prisma.examPaper.update({ where: { id }, data: { status: "MASKED" } });
  },

  unmask(id: string) {
    return prisma.examPaper.update({ where: { id }, data: { status: "PUBLISHED" } });
  },
};
