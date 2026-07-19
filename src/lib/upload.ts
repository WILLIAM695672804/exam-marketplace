// Adaptateur de stockage - Local (développement)
// En production, ce fichier peut être remplacé par un adaptateur S3/R2
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";

const UPLOAD_DIR = join(process.cwd(), env.UPLOAD_DIR);

async function ensureUploadDir(): Promise<void> {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Le dossier existe déjà
  }
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  _mimeType: string
): Promise<{ url: string; path: string; checksum: string }> {
  await ensureUploadDir();

  const checksum = createHash("sha256").update(buffer).digest("hex");
  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filePath = join(UPLOAD_DIR, safeFilename);

  await writeFile(filePath, buffer);

  return {
    url: `/api/download/${safeFilename}`,
    path: safeFilename,
    checksum,
  };
}

export async function getFile(filePath: string): Promise<Buffer | null> {
  try {
    return await readFile(join(UPLOAD_DIR, filePath));
  } catch {
    return null;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(join(UPLOAD_DIR, filePath));
  } catch {
    // Fichier inexistant
  }
}
