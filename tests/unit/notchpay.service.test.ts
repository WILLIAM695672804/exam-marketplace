import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    commission: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { notchPayService } from "@/server/payments/notchpay.service";
import { prisma } from "@/lib/prisma";

describe("notchPayService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NOTCHPAY_API_KEY = "test-key";
    vi.stubEnv("NODE_ENV", "development");
  });

  it("initiatePayment leve une erreur si la commande n'existe pas", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null as never);

    await expect(notchPayService.initiatePayment("order1")).rejects.toThrow("Commande introuvable");
  });

  it("initiatePayment leve une erreur si la commande est deja payee", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      status: "PAID",
    } as never);

    await expect(notchPayService.initiatePayment("order1")).rejects.toThrow(
      "Cette commande a deja ete payee"
    );
  });

  it("initiatePayment retourne un mode sandbox en dev", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order1",
      number: "ORD-123",
      status: "PENDING",
      totalAmount: { toString: () => "5000" },
      user: { email: "test@test.com" },
    } as never);

    const result = await notchPayService.initiatePayment("order1");

    expect(result.transaction_id).toMatch(/^sandbox-/);
    expect(result.status).toBe("PENDING");
  });

  it("handleWebhook met a jour la commande en SUCCESS", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order1",
      totalAmount: { toString: () => "5000" },
      items: [],
    } as never);
    vi.mocked(prisma.transaction.create).mockResolvedValue({} as never);
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue({ id: "tx1" } as never);
    vi.mocked(prisma.commission.create).mockResolvedValue({} as never);
    vi.mocked(prisma.order.update).mockResolvedValue({} as never);

    await notchPayService.handleWebhook({
      transaction_id: "txn-123",
      status: "SUCCESS",
      reference: "ORD-123",
      amount: 5000,
    });

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order1" },
        data: expect.objectContaining({ status: "PAID" }),
      })
    );
  });

  it("handleWebhook met a jour en CANCELLED pour FAILED", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order1",
      totalAmount: { toString: () => "5000" },
      items: [],
    } as never);
    vi.mocked(prisma.transaction.create).mockResolvedValue({} as never);
    vi.mocked(prisma.order.update).mockResolvedValue({} as never);

    await notchPayService.handleWebhook({
      transaction_id: "txn-456",
      status: "FAILED",
      reference: "ORD-123",
      amount: 5000,
    });

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELLED" }),
      })
    );
  });
});
