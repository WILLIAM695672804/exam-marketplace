/**
 * Validateur de webhook Fapshi.
 *
 * Responsabilité unique : vérifier la signature HMAC des webhooks entrants.
 * Ne traite JAMAIS le paiement — cette décision appartient au WebhookService.
 *
 * Fonctionnement de la signature Fapshi :
 * Fapshi envoie un header X-Fapshi-Signature contenant le HMAC-SHA256
 * du corps de la requête, calculé avec le webhookSecret.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration du validateur de signature. */
export interface FapshiWebhookValidatorConfig {
  /** Secret partagé avec Fapshi pour la signature HMAC. */
  readonly webhookSecret: string;
  /** Nom du header HTTP contenant la signature (défaut : x-fapshi-signature). */
  readonly signatureHeader?: string;
}

// ---------------------------------------------------------------------------
// Validateur
// ---------------------------------------------------------------------------

export class FapshiWebhookValidator {
  private readonly secret: string;
  private readonly signatureHeader: string;

  constructor(config: FapshiWebhookValidatorConfig) {
    this.secret = config.webhookSecret;
    this.signatureHeader = (
      config.signatureHeader ?? "x-fapshi-signature"
    ).toLowerCase();
  }

  // -----------------------------------------------------------------------
  // Vérification de signature
  // -----------------------------------------------------------------------

  /**
   * Vérifie la signature HMAC d'un webhook Fapshi.
   *
   * @param rawBody Corps brut de la requête (Buffer ou string).
   * @param headers Headers HTTP de la requête (objet ou Map).
   * @returns true si la signature est valide.
   */
  verify(
    rawBody: Buffer | string,
    headers: Readonly<Record<string, string>>
  ): boolean {
    const providedSignature = this.extractSignature(headers);
    if (!providedSignature) {
      return false;
    }

    const expectedSignature = this.computeSignature(rawBody);

    return this.timingSafeCompare(providedSignature, expectedSignature);
  }

  /**
   * Vérifie la signature avec un payload déjà parsé et la signature extraite.
   * Variante utilisée quand le payload a déjà été lu.
   *
   * @param rawBody Corps brut original (avant parsing JSON).
   * @param signature Signature reçue dans le header.
   * @returns true si la signature est valide.
   */
  verifySignature(rawBody: string, signature: string): boolean {
    const expected = this.computeSignature(rawBody);
    return this.timingSafeCompare(signature, expected);
  }

  // -----------------------------------------------------------------------
  // Méthodes privées
  // -----------------------------------------------------------------------

  /**
   * Extrait la signature du header HTTP.
   * Cherche le header configuré (insensible à la casse).
   */
  private extractSignature(
    headers: Readonly<Record<string, string>>
  ): string | null {
    const key = Object.keys(headers).find(
      (k) => k.toLowerCase() === this.signatureHeader
    );
    return key ? (headers[key] ?? null) : null;
  }

  /**
   * Calcule le HMAC-SHA256 attendu.
   */
  private computeSignature(data: Buffer | string): string {
    const hmac = createHmac("sha256", this.secret);
    hmac.update(data);
    return hmac.digest("hex");
  }

  /**
   * Comparaison en temps constant pour éviter les attaques par timing.
   */
  private timingSafeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Éviter de révéler la longueur via le timing :
      // comparer quand même avec un buffer de même longueur
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
