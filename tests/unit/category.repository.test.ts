import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { categoryRepository } from "@/features/categories/repositories/category.repository";
import { prisma } from "@/lib/prisma";

describe("categoryRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findAll retourne les categories non supprimees", async () => {
    const mockCategories = [{ id: "1", name: "Test" }];
    vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never);

    const result = await categoryRepository.findAll();

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } })
    );
    expect(result).toEqual(mockCategories);
  });

  it("findBySlug inclut les competitions", async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue(null as never);

    await categoryRepository.findBySlug("test");

    expect(prisma.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "test", deletedAt: null },
        include: expect.objectContaining({ competitions: expect.any(Object) }),
      })
    );
  });

  it("create appelle prisma.category.create", async () => {
    vi.mocked(prisma.category.create).mockResolvedValue({ id: "1" } as never);

    await categoryRepository.create({ name: "Nouvelle", slug: "nouvelle" });

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: "Nouvelle", slug: "nouvelle" },
      include: { _count: { select: { competitions: true } } },
    });
  });

  it("softDelete met a jour deletedAt", async () => {
    vi.mocked(prisma.category.update).mockResolvedValue({} as never);

    await categoryRepository.softDelete("cat1");

    expect(prisma.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cat1" },
        data: { deletedAt: expect.any(Date) },
      })
    );
  });
});
