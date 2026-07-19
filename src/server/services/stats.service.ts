import { prisma } from "@/lib/prisma";

export type Period = "day" | "week" | "month" | "year";

interface DownloadStatsParams {
  period?: Period;
  startDate?: string;
  endDate?: string;
  examPaperId?: string;
  authorId?: string;
}

interface DownloadPoint {
  date: string;
  count: number;
}

export interface ExamDownloadStats {
  examPaperId: string;
  title: string;
  slug: string;
  authorName: string;
  totalDownloads: number;
  points: DownloadPoint[];
}

function formatDateLabel(date: Date, period: Period): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  switch (period) {
    case "year":
      return String(y);
    case "month":
      return `${y}-${m}`;
    case "week": {
      // ISO week number
      const firstDay = new Date(y, 0, 1);
      const dayOfYear = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);
      const week = Math.ceil((dayOfYear + firstDay.getDay() + 1) / 7);
      return `${y}-W${String(week).padStart(2, "0")}`;
    }
    default:
      return `${y}-${m}-${d}`;
  }
}

function getDateRange(
  period: Period,
  startDate?: string,
  endDate?: string
): { rangeStart: Date; rangeEnd: Date } {
  const now = new Date();
  const rangeStart = startDate
    ? new Date(startDate)
    : (() => {
        const d = new Date();
        switch (period) {
          case "day":
            d.setDate(d.getDate() - 7);
            break;
          case "week":
            d.setDate(d.getDate() - 28);
            break;
          case "month":
            d.setMonth(d.getMonth() - 6);
            break;
          case "year":
            d.setFullYear(d.getFullYear() - 2);
            break;
        }
        d.setHours(0, 0, 0, 0);
        return d;
      })();
  const rangeEnd = endDate ? new Date(endDate) : now;
  return { rangeStart, rangeEnd };
}

export const statsService = {
  /**
   * Statistiques de telechargement par epreuve avec periode.
   * Utilise l'API Prisma standard + groupement en JS pour eviter les problemes de compatibilite SQL.
   */
  async getDownloadsByExam(params: DownloadStatsParams = {}): Promise<ExamDownloadStats[]> {
    const { period = "day", startDate, endDate, examPaperId, authorId } = params;
    const { rangeStart, rangeEnd } = getDateRange(period, startDate, endDate);

    // Recuperer tous les downloads dans la plage avec les relations necessaires
    const downloads = await prisma.download.findMany({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
        orderItem: {
          examPaper: {
            deletedAt: null,
            ...(examPaperId ? { id: examPaperId } : {}),
            ...(authorId ? { authorId } : {}),
          },
        },
      },
      include: {
        orderItem: {
          include: {
            examPaper: {
              select: {
                id: true,
                title: true,
                slug: true,
                author: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Grouper par epreuve puis par periode
    const grouped = new Map<
      string,
      {
        examPaperId: string;
        title: string;
        slug: string;
        authorName: string;
        points: Map<string, number>;
      }
    >();

    for (const dl of downloads) {
      const ep = dl.orderItem.examPaper;
      const key = ep.id;

      if (!grouped.has(key)) {
        grouped.set(key, {
          examPaperId: ep.id,
          title: ep.title,
          slug: ep.slug,
          authorName: `${ep.author.firstName} ${ep.author.lastName}`,
          points: new Map(),
        });
      }

      const entry = grouped.get(key)!;
      const dateLabel = formatDateLabel(dl.createdAt, period);
      entry.points.set(dateLabel, (entry.points.get(dateLabel) || 0) + 1);
    }

    // Convertir en tableau
    return Array.from(grouped.values()).map((entry) => {
      const points: DownloadPoint[] = Array.from(entry.points.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        examPaperId: entry.examPaperId,
        title: entry.title,
        slug: entry.slug,
        authorName: entry.authorName,
        totalDownloads: points.reduce((sum, p) => sum + p.count, 0),
        points,
      };
    });
  },

  /**
   * Resume global des telechargements (total par periode)
   */
  async getGlobalDownloadSummary(
    params: { period?: Period; startDate?: string; endDate?: string } = {}
  ): Promise<DownloadPoint[]> {
    const { period = "day", startDate, endDate } = params;
    const { rangeStart, rangeEnd } = getDateRange(period, startDate, endDate);

    const downloads = await prisma.download.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const grouped = new Map<string, number>();
    for (const dl of downloads) {
      const key = formatDateLabel(dl.createdAt, period);
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }

    return Array.from(grouped.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
