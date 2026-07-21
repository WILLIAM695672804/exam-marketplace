/**
 * Implémentation Fapshi Initiate Pay de IPaymentProvider.
 *
 * Mode INITIATE : génère une URL de paiement hébergée par Fapshi (POST /initiate-pay).
 * L'utilisateur est redirigé vers cette URL pour payer.
 *
 * Partage le client HTTP, la vérification de statut et la gestion des webhooks
 * avec FapshiDirectPayAdapter via FapshiHttpClient.
 */

import type {
  IPaymentProvider,
  ProviderInitiateRequest,
  ProviderInitiateResponse,
  ProviderVerifyResult,
} from "../payment-provider.interface";
import type { ProviderTransactionStatus } from "../../types/provider.types";
import type { NormalizedWebhookPayload } from "../../types/webhook.types";
import type {
  FapshiDirectPayRequest,
  FapshiInitiatePayResponse,
  FapshiTransactionStatus,
  FapshiWebhookPayload,
} from "./fapshi.types";
import { FapshiWebhookValidator } from "./fapshi-webhook.validator";
import { FapshiHttpClient } from "./fapshi-http.client";
import type { FapshiHttpConfig } from "./fapshi-http.client";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface FapshiInitiatePayConfig {
  readonly apiUser: string;
  readonly apiKey: string;
  readonly webhookSecret?: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
}

const DEFAULT_BASE_URL = "https://sandbox.fapshi.com";

// ---------------------------------------------------------------------------
// Adapter Initiate Pay
// ---------------------------------------------------------------------------

export class FapshiInitiatePayAdapter implements IPaymentProvider {
  readonly providerName = "FAPSHI";

  private readonly http: FapshiHttpClient;
  private readonly webhookValidator: FapshiWebhookValidator | null;

  constructor(config: FapshiInitiatePayConfig) {
    const httpConfig: FapshiHttpConfig = {
      apiUser: config.apiUser,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: config.timeoutMs ?? 15_000,
    };
    this.http = new FapshiHttpClient(httpConfig);
    this.webhookValidator = config.webhookSecret
      ? new FapshiWebhookValidator({ webhookSecret: config.webhookSecret })
      : null;
  }

  // -----------------------------------------------------------------------
  // Initiation Initiate Pay (POST /initiate-pay)
  // -----------------------------------------------------------------------

  /**
   * Initie un paiement hébergé chez Fapshi.
   *
   * POST {baseUrl}/initiate-pay
   *
   * Retourne une paymentUrl vers laquelle l'utilisateur doit être redirigé.
   */
  async initiatePayment(
    request: ProviderInitiateRequest
  ): Promise<ProviderInitiateResponse> {
    const phone = this.http.sanitizePhone(request.phone);
    const medium = request.medium ?? this.http.detectMedium(phone);

    const fapshiRequest: FapshiDirectPayRequest = {
      amount: request.amount,
      currency: request.currency,
      reference: request.reference,
      email: request.email,
      phone,
      medium,
      name: request.name,
      userId: request.metadata.userId,
      externalId: request.reference,
      message: request.name
        ? `Paiement ${request.name} — ${request.reference}`
        : `Paiement ${request.reference}`,
      redirectUrl: request.redirectUrl,
    };

    const response = await this.http.fetch<FapshiInitiatePayResponse>(
      "/initiate-pay",
      { method: "POST", body: JSON.stringify(fapshiRequest) }
    );

    return {
      providerTxId: response.transId,
      providerRef: response.transId,
      status: "PENDING",
      paymentUrl: response.link,
    };
  }

  // -----------------------------------------------------------------------
  // Vérification (GET /payment-status/{id}) — identique à Direct Pay
  // -----------------------------------------------------------------------

  async verifyPayment(
    providerTxId: string
  ): Promise<ProviderVerifyResult> {
    const response = await this.http.fetch<FapshiTransactionStatus>(
      `/payment-status/${encodeURIComponent(providerTxId)}`,
      { method: "GET" }
    );

    return {
      verified: response.status === "SUCCESSFUL",
      providerTxId: response.transId,
      providerRef: response.financialTransId,
      status: mapFapshiStatus(response.status),
      amount: response.amount,
      currency: "XAF",
      paidAt: response.dateConfirmed,
    };
  }

  async getTransactionStatus(
    providerTxId: string
  ): Promise<ProviderTransactionStatus> {
    const response = await this.http.fetch<FapshiTransactionStatus>(
      `/payment-status/${encodeURIComponent(providerTxId)}`,
      { method: "GET" }
    );
    return this.mapStatus(response);
  }

  // -----------------------------------------------------------------------
  // Webhook — identique à Direct Pay
  // -----------------------------------------------------------------------

  normalizeWebhookPayload(rawBody: unknown): NormalizedWebhookPayload {
    const payload = rawBody as FapshiWebhookPayload;
    return {
      provider: "FAPSHI",
      providerTxId: payload.transId,
      providerRef: payload.externalId,
      status: payload.status === "SUCCESSFUL" ? "SUCCESS" : payload.status,
      amount: payload.amount,
      currency: payload.currency ?? "XAF",
      orderReference: payload.externalId,
      metadata: payload.meta,
      receivedAt: new Date(),
    };
  }

  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    if (!this.webhookValidator) return true;
    return this.webhookValidator.verifySignature(String(payload), signature);
  }

  // -----------------------------------------------------------------------
  // Privé
  // -----------------------------------------------------------------------

  private mapStatus(
    fapshi: FapshiTransactionStatus
  ): ProviderTransactionStatus {
    const base = {
      providerTxId: fapshi.transId,
      providerRef: fapshi.financialTransId,
      amount: fapshi.amount,
      currency: "XAF",
    };
    switch (fapshi.status) {
      case "SUCCESSFUL":
        return { ...base, status: "SUCCESS", paidAt: fapshi.dateConfirmed ?? new Date().toISOString() };
      case "CREATED":
      case "PENDING":
        return { ...base, status: "PENDING", paidAt: null };
      case "FAILED":
        return { ...base, status: "FAILED", paidAt: null, failureReason: "Paiement refusé" };
      case "EXPIRED":
        return { ...base, status: "EXPIRED", paidAt: null };
      default:
        return { ...base, status: "PENDING", paidAt: null };
    }
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function mapFapshiStatus(
  fapshiStatus: string
): "SUCCESS" | "FAILED" | "PENDING" | "EXPIRED" {
  switch (fapshiStatus) {
    case "SUCCESSFUL":
    case "SUCCESS":
      return "SUCCESS";
    case "CREATED":
    case "PENDING":
      return "PENDING";
    case "FAILED":
      return "FAILED";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return "PENDING";
  }
}
