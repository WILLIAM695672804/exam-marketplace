/**
 * GET /api/download
 *
 * Téléchargement d'une épreuve. Deux modes :
 *
 *   Mode connecté : ?orderItemId=X&type=paper|correction
 *     → Vérifie la session + appartenance de la commande
 *
 *   Mode invité    : ?token=eyJ...
 *     → Vérifie la signature JWT + expiration + email + OrderItem ∈ Order
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFile } from "@/lib/upload";
import { downloadRepository } from "@/features/downloads/repositories/download.repository";
import { prisma } from "@/lib/prisma";
import { auditService } from "@/server/db/audit.service";
import { verifyDownloadToken } from "@/features/guest-checkout/download-token";

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const orderItemId = searchParams.get("orderItemId");
  const type = (searchParams.get("type") ?? "paper") as "paper" | "correction";

  // -------------------------------------------------------------------
  // Mode invité (token JWT)
  // -------------------------------------------------------------------
  if (token) {
    return handleGuestDownload(token, req);
  }

  // -------------------------------------------------------------------
  // Mode connecté (session)
  // -------------------------------------------------------------------
  if (orderItemId) {
    return handleAuthenticatedDownload(orderItemId, type, req);
  }

  return NextResponse.json(
    { error: "Paramètre orderItemId ou token requis." },
    { status: 400 }
  );
}

// ---------------------------------------------------------------------------
// Mode connecté
// ---------------------------------------------------------------------------

async function handleAuthenticatedDownload(
  orderItemId: string,
  type: "paper" | "correction",
  req: Request
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: true,
      examPaper: { include: { paperFile: true, correctionFile: true } },
      downloads: true,
    },
  });

  if (!orderItem || orderItem.order.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  return serveFile(orderItem, type, session.user.id, req);
}

// ---------------------------------------------------------------------------
// Mode invité
// ---------------------------------------------------------------------------

async function handleGuestDownload(token: string, req: Request) {
  // 1. Vérifier le jeton
  const payload = await verifyDownloadToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Lien invalide ou expiré." },
      { status: 403 }
    );
  }

  // 2. Récupérer l'OrderItem
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: payload.orderItemId },
    include: {
      order: true,
      examPaper: { include: { paperFile: true, correctionFile: true } },
      downloads: true,
    },
  });

  if (!orderItem) {
    return NextResponse.json({ error: "Épreuve introuvable." }, { status: 404 });
  }

  // 3. Vérifier que l'OrderItem appartient bien à la commande du token
  if (orderItem.orderId !== payload.orderId) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 403 });
  }

  // 4. Vérifier que la commande est payée
  if (orderItem.order.status !== "PAID") {
    return NextResponse.json({ error: "Commande non payée." }, { status: 402 });
  }

  // 5. Vérifier l'email
  if (orderItem.order.guestEmail !== payload.email) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 403 });
  }

  // 6. Vérifier le type demandé correspond au token
  if (payload.type !== (req.url.includes("correction") ? "correction" : "paper")) {
    // On utilise le type du token, pas l'URL
  }

  return serveFile(orderItem, payload.type, null, req);
}

// ---------------------------------------------------------------------------
// Logique commune : servir le fichier
// ---------------------------------------------------------------------------

async function serveFile(
  orderItem: {
    id: string;
    order: { status: string };
    examPaper: {
      id: string;
      paperFile: { path: string; mimeType?: string | null; originalName?: string | null } | null;
      correctionFile: { path: string; mimeType?: string | null; originalName?: string | null } | null;
    };
    downloads: { id: string }[];
  },
  type: "paper" | "correction",
  userId: string | null,
  req: Request
) {
  if (orderItem.order.status !== "PAID") {
    return NextResponse.json({ error: "Commande non payée" }, { status: 402 });
  }

  const file =
    type === "correction" ? orderItem.examPaper.correctionFile : orderItem.examPaper.paperFile;

  if (!file) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  // Vérifier la limite de téléchargements
  const maxDownloads = 5;
  if (orderItem.downloads.length >= maxDownloads) {
    return NextResponse.json(
      { error: "Limite de téléchargements atteinte" },
      { status: 429 }
    );
  }

  const buffer = await getFile(file.path);
  if (!buffer) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  // Enregistrer le téléchargement (userId peut être null pour les invités)
  if (userId) {
    await downloadRepository.recordDownload(
      userId,
      orderItem.id,
      req.headers.get("x-forwarded-for") || undefined,
      req.headers.get("user-agent") || undefined
    );

    await auditService.logDownload(userId, orderItem.examPaper.id);
  } else {
    // Pour les invités, on enregistre quand même le téléchargement
    // avec un userId null (le champ est nullable maintenant)
    await prisma.download.create({
      data: {
        orderItemId: orderItem.id,
        userId: null,
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType || "application/pdf",
      "Content-Disposition": `attachment; filename="${file.originalName || "epreuve.pdf"}"`,
    },
  });
}
