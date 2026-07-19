import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { statsService, type Period } from "@/server/services/stats.service";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const roles: string[] = (session.user as { roles?: string[] }).roles ?? [];
    const { searchParams } = new URL(req.url);

    const period = (searchParams.get("period") || "day") as Period;
    const examPaperId = searchParams.get("examPaperId") || undefined;

    // Admin : tout voir, Enseignant : seulement ses epreuves
    const isAdmin = roles.includes("ADMIN");
    const authorId = isAdmin ? undefined : session.user.id;

    const stats = await statsService.getDownloadsByExam({
      period,
      examPaperId,
      authorId,
    });

    return NextResponse.json(stats);
  } catch (error) {
    logger.error({ error }, "Erreur API stats/downloads");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 },
    );
  }
}
