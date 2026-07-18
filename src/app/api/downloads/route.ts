import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { downloadRepository } from "@/features/downloads/repositories/download.repository";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const downloads = await downloadRepository.findByUser(session.user.id);
  return NextResponse.json(downloads);
}
