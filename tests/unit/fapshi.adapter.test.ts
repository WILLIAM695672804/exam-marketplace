/**
 * Tests unitaires — FapshiAdapter + ProviderFactory
 *
 * Mocke fetch pour simuler les réponses HTTP de Fapshi.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FapshiAdapter } from "@/features/payments/adapters/fapshi/fapshi.adapter";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function createAdapter() {
  return new FapshiAdapter({
    apiUser: "test-user",
    apiKey: "test-api-key",
    webhookSecret: "test-webhook-secret",
  });
}

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FapshiAdapter", () => {
  describe("initiatePayment()", () => {
    it("appelle l'API Direct Pay et retourne la réponse normalisée", async () => {
      const adapter = createAdapter();
      mockFetchResponse({
        transId: "fapshi-123",
        message: "Payment initiated",
        dateInitiated: new Date().toISOString(),
      });

      const result = await adapter.initiatePayment({
        amount: 1500,
        currency: "XAF",
        reference: "ORD-456",
        email: "test@example.com",
        phone: "670000000",
        metadata: {
          orderId: "order-1",
          userId: "user-1",
          idempotencyKey: "idem-key",
        },
      });

      expect(result.providerTxId).toBe("fapshi-123");
      expect(result.providerRef).toBe("fapshi-123");
      expect(result.status).toBe("PENDING");
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("lève une erreur si Fapshi retourne une erreur HTTP", async () => {
      const adapter = createAdapter();
      mockFetchResponse({ error: "Bad request" }, false, 400);

      await expect(
        adapter.initiatePayment({
          amount: 0,
          currency: "XAF",
          reference: "ORD-456",
          email: "test@example.com",
          phone: "670000000",
          metadata: { orderId: "1", userId: "1", idempotencyKey: "k" },
        })
      ).rejects.toMatchObject({ provider: "FAPSHI", isRetryable: false });
    });
  });

  describe("providerFactory", () => {
    it("retourne le bon adapter selon le provider", async () => {
      const { ProviderFactory } = await import("@/features/payments/adapters/provider-factory");
      const factory = new ProviderFactory({
        defaultProvider: "FAPSHI",
        fapshi: { apiUser: "u", apiKey: "k", webhookSecret: "s" },
      });

      const adapter = factory.getProvider("FAPSHI");
      expect(adapter.providerName).toBe("FAPSHI");
    });

    it("réutilise la même instance (singleton)", async () => {
      const { ProviderFactory } = await import("@/features/payments/adapters/provider-factory");
      const factory = new ProviderFactory({
        defaultProvider: "FAPSHI",
        fapshi: { apiUser: "u", apiKey: "k", webhookSecret: "s" },
      });

      const a1 = factory.getProvider("FAPSHI");
      const a2 = factory.getProvider("FAPSHI");
      expect(a1).toBe(a2);
    });

    it("lève une erreur pour un provider non supporté", async () => {
      const { ProviderFactory } = await import("@/features/payments/adapters/provider-factory");
      const factory = new ProviderFactory({
        defaultProvider: "FAPSHI",
      });

      expect(() => factory.getProvider("STRIPE" as never)).toThrow(/non supporté/);
    });
  });
});
