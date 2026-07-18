import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    cartItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { orderRepository } from "@/features/orders/repositories/order.repository";
import { prisma } from "@/lib/prisma";

describe("orderRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generateNumber produit un format unique", () => {
    const num1 = orderRepository.generateNumber();
    const num2 = orderRepository.generateNumber();

    expect(num1).toMatch(/^ORD-/);
    expect(num1).not.toBe(num2);
  });

  it("findByUser appelle prisma.order.findMany avec filtre userId", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([] as never);

    await orderRepository.findByUser("user1");

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user1" } }),
    );
  });

  it("findByUser avec status ajoute le filtre status", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([] as never);

    await orderRepository.findByUser("user1", "PAID");

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user1", status: "PAID" } }),
    );
  });

  it("createFromCart leve une erreur si le panier est vide", async () => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([] as never);

    await expect(orderRepository.createFromCart("user1")).rejects.toThrow(
      "Le panier est vide",
    );
  });

  it("createFromCart cree une commande et vide le panier", async () => {
    const mockCartItems = [
      {
        examPaperId: "exam1",
        withCorrection: false,
        examPaper: { title: "Test", year: 2024, price: { toString: () => "100" }, priceWithCorrection: null },
      },
    ];

    vi.mocked(prisma.cartItem.findMany).mockResolvedValue(mockCartItems as never);
    vi.mocked(prisma.order.create).mockResolvedValue({ id: "order1", number: "ORD-123" } as never);
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 1 } as never);

    const result = await orderRepository.createFromCart("user1");

    expect(prisma.order.create).toHaveBeenCalled();
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user1" } }),
    );
    expect(result).toBeDefined();
  });
});
