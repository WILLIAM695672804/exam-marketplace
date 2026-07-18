import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    examPaper: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { examRepository } from "@/features/exams/repositories/exam.repository";
import { prisma } from "@/lib/prisma";

describe("examRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findAll retourne les epreuves avec pagination", async () => {
    vi.mocked(prisma.examPaper.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.examPaper.count).mockResolvedValue(0);

    const result = await examRepository.findAll({ page: 1, limit: 20 });

    expect(result).toEqual({ items: [], total: 0, page: 1, totalPages: 0 });
  });

  it("findAll applique les filtres de recherche", async () => {
    vi.mocked(prisma.examPaper.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.examPaper.count).mockResolvedValue(0);

    await examRepository.findAll({ search: "CFA" });

    expect(prisma.examPaper.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([expect.objectContaining({ title: expect.any(Object) })]),
        }),
      }),
    );
  });

  it("findAll applique le filtre de status PUBLISHED par defaut", async () => {
    vi.mocked(prisma.examPaper.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.examPaper.count).mockResolvedValue(0);

    await examRepository.findAll({});

    expect(prisma.examPaper.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PUBLISHED" }),
      }),
    );
  });

  it("findBySlug cherche avec le slug exact", async () => {
    const mockExam = { id: "1", slug: "test-exam", title: "Test Exam" };
    vi.mocked(prisma.examPaper.findFirst).mockResolvedValue(mockExam as never);

    const result = await examRepository.findBySlug("test-exam");

    expect(prisma.examPaper.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "test-exam", deletedAt: null } }),
    );
    expect(result).toEqual(mockExam);
  });

  it("findBySlug retourne null pour slug inexistant", async () => {
    vi.mocked(prisma.examPaper.findFirst).mockResolvedValue(null as never);

    const result = await examRepository.findBySlug("inexistant");

    expect(result).toBeNull();
  });

  it("softDelete met a jour deletedAt", async () => {
    vi.mocked(prisma.examPaper.update).mockResolvedValue({ id: "1" } as never);

    await examRepository.softDelete("exam1");

    expect(prisma.examPaper.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "exam1" },
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  it("mask change le status a MASKED", async () => {
    vi.mocked(prisma.examPaper.update).mockResolvedValue({} as never);

    await examRepository.mask("exam1");

    expect(prisma.examPaper.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "exam1" }, data: { status: "MASKED" } }),
    );
  });

  it("unmask change le status a PUBLISHED", async () => {
    vi.mocked(prisma.examPaper.update).mockResolvedValue({} as never);

    await examRepository.unmask("exam1");

    expect(prisma.examPaper.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "exam1" }, data: { status: "PUBLISHED" } }),
    );
  });
});
