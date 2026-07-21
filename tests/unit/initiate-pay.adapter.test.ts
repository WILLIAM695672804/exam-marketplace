/**
 * Tests unitaires — FapshiInitiatePayAdapter + ProviderFactory dual-mode
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(body: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

beforeEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// InitiatePayAdapter
// ---------------------------------------------------------------------------

describe("FapshiInitiatePayAdapter", () => {
  async function createAdapter() {
    const { FapshiInitiatePayAdapter } = await import(
      "@/features/payments/adapters/fapshi/initiate-pay.adapter"
    );
    return new FapshiInitiatePayAdapter({
      apiUser: "test-user",
      apiKey: "test-key",
      baseUrl: "https://sandbox.fapshi.com",
    });
  }

  it("retourne un paymentUrl lors de l'initiation", async () => {
    const adapter = await createAdapter();
    mockResponse({
      transId: "fapshi-123",
      message: "OK",
      link: "https://checkout.fapshi.com/pay/abc",
      dateInitiated: new Date().toISOString(),
    });

    const result = await adapter.initiatePayment({
      amount: 500,
      currency: "XAF",
      reference: "ORD-1",
      email: "test@test.com",
      phone: "690000000",
      name: "Test",
      metadata: { orderId: "o1", userId: "u1", idempotencyKey: "k1" },
    });

    expect(result.status).toBe("PENDING");
    expect(result.paymentUrl).toBe("https://checkout.fapshi.com/pay/abc");
    expect(result.providerTxId).toBe("fapshi-123");
  });

  it("utilise le bon endpoint /initiate-pay", async () => {
    const adapter = await createAdapter();
    mockResponse({
      transId: "tx-1",
      message: "OK",
      link: "https://checkout.fapshi.com/pay/xyz",
      dateInitiated: new Date().toISOString(),
    });

    await adapter.initiatePayment({
      amount: 100,
      currency: "XAF",
      reference: "ORD-2",
      email: "t@t.com",
      phone: "670000000",
      metadata: { orderId: "o2", userId: "u2", idempotencyKey: "k2" },
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/initiate-pay");
    expect(url).not.toContain("/direct-pay");
  });

  it("supporte verifyPayment (identique à Direct Pay)", async () => {
    const adapter = await createAdapter();
    mockResponse({
      transId: "tx-verify",
      status: "SUCCESSFUL",
      amount: 500,
      dateConfirmed: new Date().toISOString(),
      financialTransId: "FIN-001",
      revenue: 485,
      medium: "orange money",
      email: null,
      externalId: null,
      userId: null,
      dateInitiated: new Date().toISOString(),
      webhook: null,
    });

    const result = await adapter.verifyPayment("tx-verify");
    expect(result.verified).toBe(true);
    expect(result.status).toBe("SUCCESS");
  });

  it("vérifie les webhooks (identique à Direct Pay)", async () => {
    const adapter = await createAdapter();
    const payload = adapter.normalizeWebhookPayload({
      transId: "wh-1",
      externalId: "ORD-1",
      status: "SUCCESSFUL",
      amount: 500,
      currency: "XAF",
    });

    expect(payload.provider).toBe("FAPSHI");
    expect(payload.status).toBe("SUCCESS");
  });
});

// ---------------------------------------------------------------------------
// ProviderFactory — dual-mode
// ---------------------------------------------------------------------------

describe("ProviderFactory — dual-mode", () => {
  async function getFactory(mode: "DIRECT" | "INITIATE") {
    const { ProviderFactory } = await import(
      "@/features/payments/adapters/provider-factory"
    );
    return new ProviderFactory({
      defaultProvider: "FAPSHI",
      fapshiPaymentMode: mode,
      fapshi: { apiUser: "u", apiKey: "k", baseUrl: "https://sandbox.fapshi.com" },
    });
  }

  it("DIRECT → retourne FapshiAdapter (Direct Pay)", async () => {
    const { FapshiAdapter } = await import(
      "@/features/payments/adapters/fapshi/fapshi.adapter"
    );
    const factory = await getFactory("DIRECT");
    const provider = factory.getDefaultProvider();
    expect(provider).toBeInstanceOf(FapshiAdapter);
  });

  it("INITIATE → retourne FapshiInitiatePayAdapter", async () => {
    const { FapshiInitiatePayAdapter } = await import(
      "@/features/payments/adapters/fapshi/initiate-pay.adapter"
    );
    const factory = await getFactory("INITIATE");
    const provider = factory.getDefaultProvider();
    expect(provider).toBeInstanceOf(FapshiInitiatePayAdapter);
  });

  it("les deux modes ont le même providerName", async () => {
    const factoryDirect = await getFactory("DIRECT");
    const factoryInitiate = await getFactory("INITIATE");

    expect(factoryDirect.getDefaultProvider().providerName).toBe("FAPSHI");
    expect(factoryInitiate.getDefaultProvider().providerName).toBe("FAPSHI");
  });
});
