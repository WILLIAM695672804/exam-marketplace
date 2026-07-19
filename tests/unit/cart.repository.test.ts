import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock du module prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    cartItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { cartRepository } from "@/features/cart/repositories/cart.repository";
import { prisma } from "@/lib/prisma";

describe("cartRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findByUser appelle prisma.cartItem.findMany avec le bon userId", async () => {
    const mockItems = [{ id: "1", examPaperId: "exam1" }];
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue(mockItems as never);

    const result = await cartRepository.findByUser("user1");

    expect(prisma.cartItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user1" } })
    );
    expect(result).toEqual(mockItems);
  });

  it("add cree un upsert avec les bonnes donnees", async () => {
    vi.mocked(prisma.cartItem.upsert).mockResolvedValue({ id: "1" } as never);

    await cartRepository.add("user1", "exam1", true);

    expect(prisma.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_examPaperId: { userId: "user1", examPaperId: "exam1" } },
        create: { userId: "user1", examPaperId: "exam1", withCorrection: true },
      })
    );
  });

  it("remove appelle prisma.cartItem.delete", async () => {
    vi.mocked(prisma.cartItem.delete).mockResolvedValue({} as never);

    await cartRepository.remove("user1", "exam1");

    expect(prisma.cartItem.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_examPaperId: { userId: "user1", examPaperId: "exam1" } },
      })
    );
  });

  it("clear appelle prisma.cartItem.deleteMany", async () => {
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 3 } as never);

    await cartRepository.clear("user1");

    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user1" } })
    );
  });

  it("count retourne le nombre d'items", async () => {
    vi.mocked(prisma.cartItem.count).mockResolvedValue(5 as never);

    const result = await cartRepository.count("user1");

    expect(result).toBe(5);
  });
});
