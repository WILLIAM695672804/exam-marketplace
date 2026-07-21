/**
 * Tests unitaires — PaymentService
 *
 * Mocke TransactionRepository, PaymentOrderRepository et IPaymentProvider.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "@/features/payments/services/payment.service";
import { PaymentError } from "@/features/payments/errors/payment.errors";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockTransactionRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByOrderId: vi.fn(),
  findLatestByOrderId: vi.fn(),
  findByMerchantReference: vi.fn(),
  findByProviderTxId: vi.fn(),
  findByIdempotencyKey: vi.fn(),
  findPendingTransactions: vi.fn(),
  update: vi.fn(),
  saveCallbackData: vi.fn(),
  incrementAttempts: vi.fn(),
  markPending: vi.fn(),
  markSuccess: vi.fn(),
  markFailed: vi.fn(),
  markExpired: vi.fn(),
  hasSuccessTransaction: vi.fn(),
  hasPendingTransaction: vi.fn(),
};

const mockOrderRepo = {
  findById: vi.fn(),
  findByNumber: vi.fn(),
  findWithItems: vi.fn(),
  markPaid: vi.fn(),
  markCancelled: vi.fn(),
  markExpired: vi.fn(),
  belongsToUser: vi.fn(),
};

const mockProvider = {
  providerName: "FAPSHI",
  initiatePayment: vi.fn(),
  verifyPayment: vi.fn(),
  getTransactionStatus: vi.fn(),
  normalizeWebhookPayload: vi.fn(),
  verifyWebhookSignature: vi.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createService() {
  return new PaymentService(
    mockTransactionRepo as never,
    mockOrderRepo as never,
    mockProvider as never
  );
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_IDEM_KEY = "idem-key-1234567890";

function mockOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID,
    number: "ORD-ABC123",
    userId: "user-1",
    totalAmount: { toString: () => "1500" } as never,
    status: "PENDING",
    user: { email: "test@example.com" },
    ...overrides,
  };
}

function mockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    orderId: VALID_UUID,
    provider: "FAPSHI",
    status: "INITIATED",
    providerTxId: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PaymentService", () => {
  describe("initiate()", () => {
    // -----------------------------------------------------------------------
    // Succès
    // -----------------------------------------------------------------------

    it("initie un paiement avec succès", async () => {
      const svc = createService();
      const order = mockOrder();
      const tx = mockTransaction();

      mockOrderRepo.findById.mockResolvedValue(order);
      mockTransactionRepo.hasSuccessTransaction.mockResolvedValue(false);
      mockTransactionRepo.hasPendingTransaction.mockResolvedValue(false);
      mockTransactionRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTransactionRepo.create.mockResolvedValue(tx);
      mockProvider.initiatePayment.mockResolvedValue({
        providerTxId: "fapshi-123",
        providerRef: "ref-456",
        status: "PENDING",
      });
      mockTransactionRepo.markPending.mockResolvedValue({});

      const result = await svc.initiate(
        { orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY },
        "user-1"
      );

      expect(result.transactionId).toBe("tx-1");
      expect(result.status).toBe("PENDING");
      expect(result.provider).toBe("FAPSHI");
      expect(mockProvider.initiatePayment).toHaveBeenCalledOnce();
      expect(mockTransactionRepo.markPending).toHaveBeenCalledWith("tx-1", "fapshi-123", "ref-456");
    });

    it("génère la référence marchande correctement", async () => {
      const svc = createService();
      const order = mockOrder({ number: "ORD-XYZ999" });
      mockOrderRepo.findById.mockResolvedValue(order);
      mockTransactionRepo.hasSuccessTransaction.mockResolvedValue(false);
      mockTransactionRepo.hasPendingTransaction.mockResolvedValue(false);
      mockTransactionRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction());
      mockProvider.initiatePayment.mockResolvedValue({
        providerTxId: "fapshi-1",
        providerRef: "ref-1",
        status: "PENDING",
      });
      mockTransactionRepo.markPending.mockResolvedValue({});

      await svc.initiate({ orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY }, "user-1");

      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ merchantReference: "ORD-XYZ999" })
      );
    });

    // -----------------------------------------------------------------------
    // Erreurs métier
    // -----------------------------------------------------------------------

    it("rejette si la commande est introuvable", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        svc.initiate({ orderId: "bad-order", idempotencyKey: VALID_IDEM_KEY }, "user-1")
      ).rejects.toThrow(PaymentError);
    });

    it("rejette si la commande n'appartient pas à l'utilisateur", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(mockOrder({ userId: "other-user" }));

      await expect(
        svc.initiate({ orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY }, "user-1")
      ).rejects.toThrow(PaymentError);
    });

    it("rejette si la commande est déjà payée", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(mockOrder({ status: "PAID" }));

      await expect(
        svc.initiate({ orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY }, "user-1")
      ).rejects.toThrow(PaymentError);
    });

    it("rejette si la commande est annulée", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(mockOrder({ status: "CANCELLED" }));

      await expect(
        svc.initiate({ orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY }, "user-1")
      ).rejects.toThrow(PaymentError);
    });

    it("rejette si la commande est expirée", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(mockOrder({ status: "EXPIRED" }));

      await expect(
        svc.initiate({ orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY }, "user-1")
      ).rejects.toThrow(PaymentError);
    });

    it("rejette si un paiement réussi existe déjà", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(mockOrder());
      mockTransactionRepo.hasSuccessTransaction.mockResolvedValue(true);

      await expect(
        svc.initiate({ orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY }, "user-1")
      ).rejects.toThrow(PaymentError);
    });

    it("rejette si un paiement est déjà en cours", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(mockOrder());
      mockTransactionRepo.hasSuccessTransaction.mockResolvedValue(false);
      mockTransactionRepo.hasPendingTransaction.mockResolvedValue(true);

      await expect(
        svc.initiate({ orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY }, "user-1")
      ).rejects.toThrow(PaymentError);
    });

    it("rejette si le montant est zéro", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(
        mockOrder({ totalAmount: { toString: () => "0" } as never })
      );

      await expect(
        svc.initiate({ orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY }, "user-1")
      ).rejects.toThrow(PaymentError);
    });

    // -----------------------------------------------------------------------
    // Idempotence
    // -----------------------------------------------------------------------

    it("retourne la transaction existante si la clé d'idempotence est déjà utilisée", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(mockOrder());
      mockTransactionRepo.hasSuccessTransaction.mockResolvedValue(false);
      mockTransactionRepo.hasPendingTransaction.mockResolvedValue(false);
      mockTransactionRepo.findByIdempotencyKey.mockResolvedValue(
        mockTransaction({ id: "tx-existing", status: "PENDING", provider: "FAPSHI" })
      );

      const result = await svc.initiate(
        { orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY },
        "user-1"
      );

      expect(result.transactionId).toBe("tx-existing");
      expect(result.status).toBe("PENDING");
      // Le provider ne doit PAS être appelé
      expect(mockProvider.initiatePayment).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // Erreurs provider
    // -----------------------------------------------------------------------

    it("marque FAILED si le provider échoue", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(mockOrder());
      mockTransactionRepo.hasSuccessTransaction.mockResolvedValue(false);
      mockTransactionRepo.hasPendingTransaction.mockResolvedValue(false);
      mockTransactionRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction());
      mockProvider.initiatePayment.mockRejectedValue(new Error("Fapshi down"));
      mockTransactionRepo.markFailed.mockResolvedValue({});
      mockTransactionRepo.incrementAttempts.mockResolvedValue({});

      const result = await svc.initiate(
        { orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY },
        "user-1"
      );

      expect(result.status).toBe("FAILED");
      expect(mockTransactionRepo.markFailed).toHaveBeenCalledWith("tx-1", "Fapshi down");
      expect(mockTransactionRepo.incrementAttempts).toHaveBeenCalled();
    });

    it("incrémente les tentatives même en cas d'erreur inconnue", async () => {
      const svc = createService();
      mockOrderRepo.findById.mockResolvedValue(mockOrder());
      mockTransactionRepo.hasSuccessTransaction.mockResolvedValue(false);
      mockTransactionRepo.hasPendingTransaction.mockResolvedValue(false);
      mockTransactionRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction());
      mockProvider.initiatePayment.mockRejectedValue("erreur non-standard");
      mockTransactionRepo.markFailed.mockResolvedValue({});
      mockTransactionRepo.incrementAttempts.mockResolvedValue({});

      const result = await svc.initiate(
        { orderId: VALID_UUID, idempotencyKey: VALID_IDEM_KEY },
        "user-1"
      );

      expect(result.status).toBe("FAILED");
      expect(mockTransactionRepo.markFailed).toHaveBeenCalled();
      expect(mockTransactionRepo.incrementAttempts).toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // Validation Zod
    // -----------------------------------------------------------------------

    it("rejette si orderId est invalide", async () => {
      const svc = createService();

      await expect(
        svc.initiate({ orderId: "not-a-uuid", idempotencyKey: VALID_IDEM_KEY }, "user-1")
      ).rejects.toThrow(PaymentError);
    });

    it("rejette si idempotencyKey est trop courte", async () => {
      const svc = createService();

      await expect(
        svc.initiate(
          { orderId: "00000000-0000-0000-0000-000000000001", idempotencyKey: "short" },
          "user-1"
        )
      ).rejects.toThrow(PaymentError);
    });
  });

  // -----------------------------------------------------------------------
  // verify()
  // -----------------------------------------------------------------------

  describe("verify()", () => {
    it("retourne null si aucune transaction n'existe", async () => {
      const svc = createService();
      mockTransactionRepo.findLatestByOrderId.mockResolvedValue(null);

      const result = await svc.verify(VALID_UUID);
      expect(result).toBeNull();
    });

    it("retourne le statut de la transaction existante", async () => {
      const svc = createService();
      mockTransactionRepo.findLatestByOrderId.mockResolvedValue(
        mockTransaction({ providerTxId: "fapshi-1", status: "PENDING" })
      );
      mockProvider.verifyPayment.mockResolvedValue({
        verified: false,
        status: "PENDING",
      });

      const result = await svc.verify(VALID_UUID);
      expect(result).not.toBeNull();
      expect(result!.verified).toBe(false);
      expect(result!.status).toBe("PENDING");
    });

    it("réconcilie si le provider confirme SUCCESS", async () => {
      const svc = createService();
      mockTransactionRepo.findLatestByOrderId.mockResolvedValue(
        mockTransaction({ providerTxId: "fapshi-1", status: "PENDING" })
      );
      mockProvider.verifyPayment.mockResolvedValue({
        verified: true,
        status: "SUCCESS",
      });
      mockTransactionRepo.markSuccess.mockResolvedValue({});

      const result = await svc.verify(VALID_UUID);
      expect(result).not.toBeNull();
      expect(result!.verified).toBe(true);
      expect(result!.status).toBe("SUCCESS");
      expect(mockTransactionRepo.markSuccess).toHaveBeenCalledWith("tx-1");
    });
  });
});
