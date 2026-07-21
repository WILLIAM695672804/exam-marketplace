/**
 * Client HTTP partagé pour les appels à l'API Fapshi.
 *
 * Utilisé par FapshiDirectPayAdapter et FapshiInitiatePayAdapter.
 * Gère : headers, timeout, sanitizePhone, detectMedium, erreurs.
 */

import type { ProviderError } from "../../types/provider.types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface FapshiHttpConfig {
  readonly apiUser: string;
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class FapshiHttpClient {
  readonly baseUrl: string;
  private readonly apiUser: string;
  private readonly apiKey: string;
  readonly timeoutMs: number;

  constructor(config: FapshiHttpConfig) {
    this.baseUrl = config.baseUrl;
    this.apiUser = config.apiUser;
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs;
  }

  // -----------------------------------------------------------------------
  // HTTP
  // -----------------------------------------------------------------------

  /** Effectue un appel HTTP à l'API Fapshi. */
  async fetch<T>(path: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          apiuser: this.apiUser,
          apikey: this.apiKey,
          ...options.headers,
        },
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw this.error(0, "TIMEOUT", "Fapshi n'a pas répondu à temps", true);
      }
      throw this.error(0, "NETWORK_ERROR", "Erreur réseau", true);
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw this.error(
        response.status,
        `HTTP_${response.status}`,
        errorBody || response.statusText,
        response.status >= 500 || response.status === 429
      );
    }

    return response.json() as Promise<T>;
  }

  // -----------------------------------------------------------------------
  // Utilitaires
  // -----------------------------------------------------------------------

  /**
   * Nettoie le numéro de téléphone pour le format Fapshi (67XXXXXXX / 69XXXXXXX).
   * Supprime le préfixe 237 et les caractères non-numériques.
   */
  sanitizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("237") && cleaned.length > 9) {
      cleaned = cleaned.slice(3);
    }
    return cleaned;
  }

  /**
   * Détecte le moyen de paiement à partir du préfixe.
   * 69x / 65x → "orange money", sinon → "mobile money".
   */
  detectMedium(phone: string): "mobile money" | "orange money" {
    if (phone.startsWith("69") || phone.startsWith("65")) {
      return "orange money";
    }
    return "mobile money";
  }

  // -----------------------------------------------------------------------
  // Erreur
  // -----------------------------------------------------------------------

  private error(
    httpStatus: number,
    code: string,
    message: string,
    isRetryable: boolean
  ): ProviderError {
    return {
      provider: "FAPSHI",
      httpStatus,
      code,
      message,
      isRetryable,
    };
  }
}
