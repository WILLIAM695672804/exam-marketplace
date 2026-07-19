import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 50 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(buffer, file.name, file.type);

    const { prisma } = await import("@/lib/prisma");
    const fileRecord = await prisma.file.create({
      data: {
        url: result.url,
        path: result.path,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        checksum: result.checksum,
        storageProvider: "LOCAL",
      },
    });

    return NextResponse.json({
      ...fileRecord,
      size: fileRecord.size?.toString() ?? null,
    });
  } catch (error) {
    logger.error({ error }, "Erreur upload fichier");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur upload" },
      { status: 500 }
    );
  }
}
