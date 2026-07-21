/**
 * Tests unitaires — WebhookService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebhookService } from "@/features/payments/services/webhook.service";
import { PaymentError } from "@/features/payments/errors/payment.errors";

const mockTransactionRepo = {
  findByProviderTxId: vi.fn(),
  findByMerchantReference: vi.fn(),
  saveCallbackData: vi.fn(),
  markSuccess: vi.fn(),
  markFailed: vi.fn(),
  markExpired: vi.fn(),
};

const mockOrderRepo = {
  findByNumber: vi.fn(),
  markPaid: vi.fn(),
  markCancelled: vi.fn(),
  markExpired: vi.fn(),
};

const mockProvider = {
  verifyWebhookSignature: vi.fn(),
  normalizeWebhookPayload: vi.fn(),
  verifyPayment: vi.fn(),
};

const mockCommissionService = {
  calculate: vi.fn(),
};

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const RAW_BODY =
  '{"transId":"fapshi-1","reference":"ref-1","status":"SUCCESS","amount":1500,"currency":"XAF"}';

function createService() {
  return new WebhookService(
    mockTransactionRepo as never,
    mockOrderRepo as never,
    mockProvider as never,
    mockCommissionService
  );
}

function mockOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID,
    totalAmount: { toString: () => "1500" } as never,
    ...overrides,
  };
}

function mockTx(overrides: Record<string, unknown> = {}) {
  return { id: "tx-1", ...overrides };
}

function successPayload() {
  return {
    provider: "FAPSHI",
    providerTxId: "fapshi-tx-1",
    providerRef: "ref-1",
    status: "SUCCESS" as const,
    amount: 1500,
    currency: "XAF",
    orderReference: "ORD-123",
    receivedAt: new Date(),
  };
}

beforeEach(() => vi.clearAllMocks());

describe("WebhookService", () => {
  describe("process()", () => {
    it("rejette si la signature est invalide", async () => {
      const svc = createService();
      mockProvider.verifyWebhookSignature.mockReturnValue(false);

      await expect(svc.process("raw-body", "bad-sig", "1.2.3.4")).rejects.toThrow(PaymentError);
    });

    it("détecte un webhook déjà traité (duplicate)", async () => {
      const svc = createService();
      mockProvider.verifyWebhookSignature.mockReturnValue(true);
      mockProvider.normalizeWebhookPayload.mockReturnValue(successPayload());
      mockTransactionRepo.findByProviderTxId.mockResolvedValue(mockTx({ status: "SUCCESS" }));

      const result = await svc.process(RAW_BODY, "sig", "1.2.3.4");
      expect(result.processed).toBe(false);
      if (!result.processed) {
        expect(result.reason).toBe("DUPLICATE");
      }
    });

    it("détecte une commande introuvable", async () => {
      const svc = createService();
      mockProvider.verifyWebhookSignature.mockReturnValue(true);
      mockProvider.normalizeWebhookPayload.mockReturnValue(successPayload());
      mockTransactionRepo.findByProviderTxId.mockResolvedValue(null);
      mockOrderRepo.findByNumber.mockResolvedValue(null);

      const result = await svc.process(RAW_BODY, "sig", "1.2.3.4");
      expect(result.processed).toBe(false);
      if (!result.processed) {
        expect(result.reason).toBe("ORDER_NOT_FOUND");
      }
    });

    it("détecte un montant incorrect", async () => {
      const svc = createService();
      mockProvider.verifyWebhookSignature.mockReturnValue(true);
      mockProvider.normalizeWebhookPayload.mockReturnValue({
        ...successPayload(),
        amount: 9999,
      });
      mockTransactionRepo.findByProviderTxId.mockResolvedValue(null);
      mockOrderRepo.findByNumber.mockResolvedValue(mockOrder());

      const result = await svc.process(RAW_BODY, "sig", "1.2.3.4");
      expect(result.processed).toBe(false);
      if (!result.processed) {
        expect(result.reason).toBe("AMOUNT_MISMATCH");
      }
    });

    it("détecte une devise incorrecte", async () => {
      const svc = createService();
      mockProvider.verifyWebhookSignature.mockReturnValue(true);
      mockProvider.normalizeWebhookPayload.mockReturnValue({
        ...successPayload(),
        currency: "USD",
      });
      mockTransactionRepo.findByProviderTxId.mockResolvedValue(null);
      mockOrderRepo.findByNumber.mockResolvedValue(mockOrder());

      const result = await svc.process(RAW_BODY, "sig", "1.2.3.4");
      expect(result.processed).toBe(false);
      if (!result.processed) {
        expect(result.reason).toBe("CURRENCY_MISMATCH");
      }
    });

    it("traite un webhook SUCCESS", async () => {
      const svc = createService();
      mockProvider.verifyWebhookSignature.mockReturnValue(true);
      mockProvider.normalizeWebhookPayload.mockReturnValue(successPayload());
      mockTransactionRepo.findByProviderTxId.mockResolvedValue(null);
      mockOrderRepo.findByNumber.mockResolvedValue(mockOrder());
      mockProvider.verifyPayment.mockResolvedValue({
        verified: true,
        status: "SUCCESS",
      });
      mockTransactionRepo.findByMerchantReference.mockResolvedValue(mockTx());
      mockTransactionRepo.saveCallbackData.mockResolvedValue({});
      mockTransactionRepo.markSuccess.mockResolvedValue({});
      mockOrderRepo.markPaid.mockResolvedValue({});
      mockCommissionService.calculate.mockResolvedValue(1);

      const result = await svc.process(RAW_BODY, "sig", "1.2.3.4");

      expect(result.processed).toBe(true);
      if (result.processed) {
        expect(result.newStatus).toBe("SUCCESS");
        expect(result.orderStatus).toBe("PAID");
      }
      expect(mockTransactionRepo.markSuccess).toHaveBeenCalled();
      expect(mockOrderRepo.markPaid).toHaveBeenCalled();
      expect(mockCommissionService.calculate).toHaveBeenCalled();
    });

    it("bloque un webhook FAILED par double vérification", async () => {
      const svc = createService();
      mockProvider.verifyWebhookSignature.mockReturnValue(true);
      mockProvider.normalizeWebhookPayload.mockReturnValue({
        ...successPayload(),
        status: "FAILED",
      });
      mockTransactionRepo.findByProviderTxId.mockResolvedValue(null);
      mockOrderRepo.findByNumber.mockResolvedValue(mockOrder());
      mockProvider.verifyPayment.mockResolvedValue({
        verified: false,
        status: "FAILED",
      });

      const result = await svc.process(RAW_BODY, "sig", "1.2.3.4");

      expect(result.processed).toBe(false);
      if (!result.processed) {
        expect(result.reason).toBe("PROVIDER_VERIFICATION_FAILED");
      }
    });

    it("bloque un webhook EXPIRED par double vérification", async () => {
      const svc = createService();
      mockProvider.verifyWebhookSignature.mockReturnValue(true);
      mockProvider.normalizeWebhookPayload.mockReturnValue({
        ...successPayload(),
        status: "EXPIRED",
      });
      mockTransactionRepo.findByProviderTxId.mockResolvedValue(null);
      mockOrderRepo.findByNumber.mockResolvedValue(mockOrder());
      mockProvider.verifyPayment.mockResolvedValue({
        verified: false,
        status: "EXPIRED",
      });

      const result = await svc.process(RAW_BODY, "sig", "1.2.3.4");

      expect(result.processed).toBe(false);
      if (!result.processed) {
        expect(result.reason).toBe("PROVIDER_VERIFICATION_FAILED");
      }
    });
  });
});
