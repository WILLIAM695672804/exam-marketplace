/**
 * Tests unitaires — CommissionService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CommissionService,
  DEFAULT_COMMISSION_POLICY,
} from "@/features/payments/services/commission.service";

const mockCommissionRepo = {
  create: vi.fn(),
  createMany: vi.fn(),
  findById: vi.fn(),
  findByTransactionId: vi.fn(),
  findByTeacherId: vi.fn(),
  update: vi.fn(),
  hasCommission: vi.fn(),
};

const mockOrderRepo = {
  findWithItems: vi.fn(),
};

function createService() {
  return new CommissionService(
    mockCommissionRepo as never,
    mockOrderRepo as never,
    DEFAULT_COMMISSION_POLICY
  );
}

function mockOrderItem(examPaperId: string, authorId: string, price: number) {
  return {
    examPaperId,
    price: { toString: () => String(price) } as never,
    examPaper: { authorId, title: "Test" },
  };
}

beforeEach(() => vi.clearAllMocks());

describe("CommissionService", () => {
  describe("calculate()", () => {
    it("calcule des commissions pour une commande simple", async () => {
      const svc = createService();
      mockOrderRepo.findWithItems.mockResolvedValue({
        items: [mockOrderItem("ep-1", "teacher-1", 1500)],
      });
      mockCommissionRepo.hasCommission.mockResolvedValue(false);
      mockCommissionRepo.createMany.mockResolvedValue([]);

      const count = await svc.calculate("tx-1", "order-1");
      expect(count).toBe(1);
      expect(mockCommissionRepo.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            transactionId: "tx-1",
            teacherId: "teacher-1",
            examPaperId: "ep-1",
            platformAmount: 225, // 1500 * 0.15
            teacherAmount: 1275,
          }),
        ])
      );
    });

    it("calcule des commissions pour plusieurs enseignants", async () => {
      const svc = createService();
      mockOrderRepo.findWithItems.mockResolvedValue({
        items: [
          mockOrderItem("ep-A", "teacher-X", 1000),
          mockOrderItem("ep-B", "teacher-Y", 2000),
          mockOrderItem("ep-C", "teacher-X", 500),
        ],
      });
      mockCommissionRepo.hasCommission.mockResolvedValue(false);
      mockCommissionRepo.createMany.mockResolvedValue([]);

      const count = await svc.calculate("tx-1", "order-1");
      expect(count).toBe(3);

      const inputs = (mockCommissionRepo.createMany.mock.calls[0] as never[])[0] as Array<{
        teacherId: string;
      }>;
      const teacherIds = inputs.map((c: { teacherId: string }) => c.teacherId);
      expect(teacherIds).toEqual(["teacher-X", "teacher-Y", "teacher-X"]);
    });

    it("ne recalcule pas si la commission existe déjà", async () => {
      const svc = createService();
      mockOrderRepo.findWithItems.mockResolvedValue({
        items: [mockOrderItem("ep-1", "teacher-1", 1500)],
      });
      mockCommissionRepo.hasCommission.mockResolvedValue(true);

      const count = await svc.calculate("tx-1", "order-1");
      expect(count).toBe(0);
      // createMany ne doit pas être appelé
      expect(mockCommissionRepo.createMany).not.toHaveBeenCalled();
    });

    it("retourne 0 si la commande n'a pas d'items", async () => {
      const svc = createService();
      mockOrderRepo.findWithItems.mockResolvedValue({ items: [] });
      mockCommissionRepo.hasCommission.mockResolvedValue(false);

      const count = await svc.calculate("tx-1", "order-1");
      expect(count).toBe(0);
      expect(mockCommissionRepo.createMany).not.toHaveBeenCalled();
    });
  });

  describe("computeSplit()", () => {
    it("applique le taux par défaut (15%)", () => {
      const svc = createService();
      const { platformAmount, teacherAmount } = svc.computeSplit(1000, false);
      expect(platformAmount).toBe(150); // 15%
      expect(teacherAmount).toBe(850);
    });

    it("applique le montant minimum plateforme", () => {
      const svc = createService();
      const { platformAmount } = svc.computeSplit(100, false);
      // 15% de 100 = 15 → plancher à 50
      expect(platformAmount).toBe(50);
    });

    it("ne prend pas plus que le montant total", () => {
      const svc = createService();
      const { platformAmount, teacherAmount } = svc.computeSplit(30, false);
      // 15% de 30 = 4.5 → arrondi à 5 → plancher 50 → cap à 30
      expect(platformAmount).toBeLessThanOrEqual(30);
      expect(teacherAmount).toBeGreaterThanOrEqual(0);
      expect(platformAmount + teacherAmount).toBe(30);
    });

    it("arrondit les montants", () => {
      const svc = createService();
      const { platformAmount, teacherAmount } = svc.computeSplit(333, false);
      // 15% de 333 = 49.95 → arrondi à 50 → minimum = 50
      expect(platformAmount).toBe(50);
      expect(teacherAmount).toBe(283);
      expect(platformAmount + teacherAmount).toBe(333);
    });
  });
});
