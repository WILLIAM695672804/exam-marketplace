/**
 * Factory de sélection du provider de paiement.
 *
 * Retourne l'adapter correspondant au provider configuré.
 * Pour Fapshi, sélectionne Direct Pay ou Initiate Pay selon FAPSHI_PAYMENT_MODE.
 *
 * Extensible à Campay, Stripe, NotchPay sans modifier le code existant.
 * PaymentService ne connaît jamais le mode — il appelle IPaymentProvider.initiatePayment().
 */

import type { IPaymentProvider } from "./payment-provider.interface";
import type { PaymentProvider } from "../types/payment.types";
import { FapshiAdapter } from "./fapshi/fapshi.adapter";
import { FapshiInitiatePayAdapter } from "./fapshi/initiate-pay.adapter";
import type { FapshiAdapterConfig } from "./fapshi/fapshi.adapter";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ProviderFactoryConfig {
  readonly defaultProvider: PaymentProvider;
  /** Mode de paiement Fapshi : DIRECT (mobile) ou INITIATE (URL hébergée). */
  readonly fapshiPaymentMode?: "DIRECT" | "INITIATE";
  readonly fapshi?: FapshiAdapterConfig;
  // Futures extensions :
  // readonly campay?: CampayAdapterConfig;
  // readonly stripe?: StripeAdapterConfig;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export class ProviderFactory {
  private readonly config: ProviderFactoryConfig;
  private readonly instances = new Map<string, IPaymentProvider>();

  constructor(config: ProviderFactoryConfig) {
    this.config = config;
  }

  /**
   * Retourne l'adapter pour le provider demandé.
   * Pour Fapshi, le mode (DIRECT ou INITIATE) est déterminé par fapshiPaymentMode.
   */
  getProvider(provider?: PaymentProvider): IPaymentProvider {
    const name = provider ?? this.config.defaultProvider;
    const mode = this.config.fapshiPaymentMode ?? "DIRECT";
    const cacheKey = `${name}:${mode}`;

    const existing = this.instances.get(cacheKey);
    if (existing) return existing;

    const instance = this.createInstance(name, mode);
    this.instances.set(cacheKey, instance);
    return instance;
  }

  getDefaultProvider(): IPaymentProvider {
    return this.getProvider(this.config.defaultProvider);
  }

  // -----------------------------------------------------------------------
  // Création
  // -----------------------------------------------------------------------

  private createInstance(name: PaymentProvider, mode: "DIRECT" | "INITIATE"): IPaymentProvider {
    switch (name) {
      case "FAPSHI": {
        if (!this.config.fapshi) {
          throw new Error("Configuration Fapshi manquante.");
        }
        return mode === "INITIATE"
          ? new FapshiInitiatePayAdapter(this.config.fapshi)
          : new FapshiAdapter(this.config.fapshi);
      }

      default:
        throw new Error(`Provider "${name}" non supporté.`);
    }
  }
}
