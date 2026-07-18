import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { notificationRepository } from "@/features/notifications/repositories/notification.repository";
import { prisma } from "@/lib/prisma";

describe("notificationRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findByUser retourne les 50 dernieres notifications", async () => {
    vi.mocked(prisma.notification.findMany).mockResolvedValue([] as never);

    await notificationRepository.findByUser("user1");

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user1" }, take: 50 }),
    );
  });

  it("countUnread compte les notifications non lues", async () => {
    vi.mocked(prisma.notification.count).mockResolvedValue(3 as never);

    const result = await notificationRepository.countUnread("user1");

    expect(result).toBe(3);
    expect(prisma.notification.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user1", read: false } }),
    );
  });

  it("markAsRead met a jour une notification specifique", async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 });

    await notificationRepository.markAsRead("notif1", "user1");

    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "notif1", userId: "user1" },
        data: { read: true },
      }),
    );
  });

  it("markAllAsRead met a jour toutes les notifications non lues", async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 });

    await notificationRepository.markAllAsRead("user1");

    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user1", read: false },
        data: { read: true },
      }),
    );
  });
});
