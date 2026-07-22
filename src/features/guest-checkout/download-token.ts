/**
 * Gestion des jetons de téléchargement JWT pour le checkout invité.
 *
 * Chaque jeton est signé en HMAC-SHA256 avec AUTH_SECRET.
 * Pas de table dédiée : la validation se fait par signature + expiration.
 */

import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DownloadTokenPayload {
  /** Version du format (pour compatibilité future). */
  version: 1;
  /** UUID de la commande. */
  orderId: string;
  /** UUID de l'OrderItem concerné. */
  orderItemId: string;
  /** Email de l'acheteur invité. */
  email: string;
  /** Type de fichier à télécharger. */
  type: "paper" | "correction";
}

/** Paramètres pour la génération d'un jeton. */
export interface GenerateTokenInput {
  orderId: string;
  orderItemId: string;
  email: string;
  type: "paper" | "correction";
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const TOKEN_EXPIRATION_DAYS = 7;
const SECRET = new TextEncoder().encode(env.AUTH_SECRET);

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Génère un jeton de téléchargement signé.
 *
 * @param input Données du jeton.
 * @returns Le jeton JWT compact.
 */
export async function generateDownloadToken(input: GenerateTokenInput): Promise<string> {
  const payload: DownloadTokenPayload = {
    version: 1,
    orderId: input.orderId,
    orderItemId: input.orderItemId,
    email: input.email,
    type: input.type,
  };

  const expirationSeconds = TOKEN_EXPIRATION_DAYS * 24 * 3600;

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expirationSeconds}s`)
    .sign(SECRET);
}

/**
 * Vérifie et décode un jeton de téléchargement.
 *
 * @param token Le jeton JWT compact.
 * @returns Le payload décodé, ou null si invalide / expiré.
 */
export async function verifyDownloadToken(token: string): Promise<DownloadTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: ["HS256"],
    });

    const version = payload.version as number;
    if (typeof version !== "number" || version !== 1) {
      return null;
    }

    return payload as unknown as DownloadTokenPayload;
  } catch {
    return null;
  }
}
