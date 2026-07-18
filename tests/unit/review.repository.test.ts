import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: {
      create: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { reviewRepository } from "@/features/reviews/repositories/review.repository";
import { prisma } from "@/lib/prisma";

describe("reviewRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create cree un avis", async () => {
    vi.mocked(prisma.review.create).mockResolvedValue({ id: "r1" } as never);

    await reviewRepository.create("item1", 5, "Excellent");

    expect(prisma.review.create).toHaveBeenCalledWith({
      data: { orderItemId: "item1", rating: 5, comment: "Excellent" },
    });
  });

  it("create accepte un avis sans commentaire", async () => {
    vi.mocked(prisma.review.create).mockResolvedValue({ id: "r1" } as never);

    await reviewRepository.create("item1", 4);

    expect(prisma.review.create).toHaveBeenCalledWith({
      data: { orderItemId: "item1", rating: 4, comment: undefined },
    });
  });

  it("getAverageRating calcule la moyenne", async () => {
    vi.mocked(prisma.review.aggregate).mockResolvedValue({
      _avg: { rating: 4.5 },
      _count: { rating: 10 },
    } as never);

    const result = await reviewRepository.getAverageRating("exam1");

    expect(result._avg?.rating).toBe(4.5);
    expect(result._count?.rating).toBe(10);
  });
});
