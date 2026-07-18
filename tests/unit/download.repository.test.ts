import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    orderItem: { findFirst: vi.fn() },
    download: { create: vi.fn(), findMany: vi.fn() },
  },
}));

import { downloadRepository } from "@/features/downloads/repositories/download.repository";
import { prisma } from "@/lib/prisma";

describe("downloadRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("canDownload retourne true si moins de 5 telechargements", async () => {
    vi.mocked(prisma.orderItem.findFirst).mockResolvedValue({
      downloads: [{ id: "d1" }, { id: "d2" }],
      order: { status: "PAID" },
    } as never);

    const result = await downloadRepository.canDownload("user1", "exam1");

    expect(result).toBe(true);
  });

  it("canDownload retourne false si 5 telechargements ou plus", async () => {
    vi.mocked(prisma.orderItem.findFirst).mockResolvedValue({
      downloads: [{}, {}, {}, {}, {}],
      order: { status: "PAID" },
    } as never);

    const result = await downloadRepository.canDownload("user1", "exam1");

    expect(result).toBe(false);
  });

  it("canDownload retourne false si pas de commande", async () => {
    vi.mocked(prisma.orderItem.findFirst).mockResolvedValue(null as never);

    const result = await downloadRepository.canDownload("user1", "exam1");

    expect(result).toBe(false);
  });

  it("recordDownload cree un enregistrement", async () => {
    vi.mocked(prisma.download.create).mockResolvedValue({ id: "d1" } as never);

    await downloadRepository.recordDownload("user1", "item1", "127.0.0.1", "Mozilla/5.0");

    expect(prisma.download.create).toHaveBeenCalledWith({
      data: {
        userId: "user1",
        orderItemId: "item1",
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
      },
    });
  });
});
