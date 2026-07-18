import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFile } from "@/lib/upload";
import { downloadRepository } from "@/features/downloads/repositories/download.repository";
import { prisma } from "@/lib/prisma";
import { auditService } from "@/server/db/audit.service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderItemId = searchParams.get("orderItemId");
  const type = searchParams.get("type"); // "paper" | "correction"

  if (!orderItemId) {
    return NextResponse.json({ error: "orderItemId requis" }, { status: 400 });
  }

  // Verifier que la commande appartient a l'utilisateur et est payee
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: true,
      examPaper: { include: { paperFile: true, correctionFile: true } },
      downloads: true,
    },
  });

  if (!orderItem || orderItem.order.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  if (orderItem.order.status !== "PAID") {
    return NextResponse.json({ error: "Commande non payee" }, { status: 402 });
  }

  const file =
    type === "correction"
      ? orderItem.examPaper.correctionFile
      : orderItem.examPaper.paperFile;

  if (!file) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  // Verifier la limite de telechargements
  const maxDownloads = 5;
  if (orderItem.downloads.length >= maxDownloads) {
    return NextResponse.json(
      { error: "Limite de telechargements atteinte" },
      { status: 429 },
    );
  }

  const buffer = await getFile(file.path);
  if (!buffer) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  // Enregistrer le telechargement
  await downloadRepository.recordDownload(
    session.user.id,
    orderItemId,
    req.headers.get("x-forwarded-for") || undefined,
    req.headers.get("user-agent") || undefined,
  );

  await auditService.logDownload(session.user.id, orderItem.examPaper.id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType || "application/pdf",
      "Content-Disposition": `attachment; filename="${file.originalName || "epreuve.pdf"}"`,
    },
  });
}
