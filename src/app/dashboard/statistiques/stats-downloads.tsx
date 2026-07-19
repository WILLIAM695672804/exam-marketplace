"use client";

import { useState, useEffect, useCallback } from "react";
import type { Period } from "@/server/services/stats.service";

interface DownloadPoint {
  date: string;
  count: number;
}

interface ExamDownloadStats {
  examPaperId: string;
  title: string;
  slug: string;
  authorName: string;
  totalDownloads: number;
  points: DownloadPoint[];
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Annee" },
];

function formatDateLabel(date: string, period: Period): string {
  if (period === "year") return date;
  if (period === "month") {
    const [y, m] = date.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("fr", {
      year: "numeric",
      month: "long",
    });
  }
  if (period === "week") {
    const [y, w] = date.split("-");
    return `S${w} ${y}`;
  }
  return new Date(date).toLocaleDateString("fr", { day: "numeric", month: "short" });
}

export function StatsDownloads() {
  const [period, setPeriod] = useState<Period>("day");
  const [stats, setStats] = useState<ExamDownloadStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats/downloads?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const errData = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        setError(errData.error || `Erreur HTTP ${res.status}`);
      }
    } catch {
      setError("API inaccessible");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchStats est un data fetcher asynchrone, pas un setState direct
    void fetchStats();
  }, [fetchStats]);

  const totalDownloads = stats.reduce((sum, s) => sum + s.totalDownloads, 0);

  return (
    <div className="space-y-8">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-headline-sm text-primary">Telechargements par epreuve</h3>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setPeriod(p.value);
                setExpanded(null);
              }}
              className={`font-label-caps text-label-caps uppercase px-4 py-2 transition-colors border ${
                period === p.value
                  ? "bg-primary text-on-primary border-primary"
                  : "text-on-surface-variant border-outline-variant hover:text-primary hover:border-primary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="bg-surface-container-lowest border border-outline-variant p-6 flex items-center gap-4">
        <span className="material-symbols-outlined text-[32px] text-secondary">download</span>
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            Total telechargements
          </p>
          <p className="font-headline-md text-primary">{loading ? "..." : totalDownloads}</p>
        </div>
      </div>

      {/* Liste des epreuves */}
      {error ? (
        <div className="border border-error bg-error-container/20 p-8 text-center">
          <span className="material-symbols-outlined text-[32px] text-error mb-3 block">
            error_outline
          </span>
          <p className="font-body-md text-on-error-container mb-2">Erreur de chargement</p>
          <p className="font-body-sm text-on-surface-variant mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="font-label-caps text-label-caps text-primary border border-primary px-4 py-2 hover:bg-surface-container-low transition-colors"
          >
            Reessayer
          </button>
        </div>
      ) : loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-variant" />
          ))}
        </div>
      ) : stats.length === 0 ? (
        <p className="text-center text-on-surface-variant py-20 border border-outline-variant">
          Aucun telechargement sur cette periode.
        </p>
      ) : (
        <div className="space-y-4">
          {stats.map((exam) => (
            <div
              key={exam.examPaperId}
              className="border border-outline-variant bg-surface-container-lowest"
            >
              {/* En-tete de l'epreuve */}
              <button
                onClick={() => setExpanded(expanded === exam.examPaperId ? null : exam.examPaperId)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body-md text-primary truncate">{exam.title}</p>
                  <p className="font-body-sm text-on-surface-variant">
                    {exam.authorName} — {exam.totalDownloads} telechargement
                    {exam.totalDownloads > 1 ? "s" : ""}
                  </p>
                </div>
                <span
                  className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform shrink-0 ml-4 ${expanded === exam.examPaperId ? "rotate-180" : ""}`}
                >
                  expand_more
                </span>
              </button>

              {/* Details deployes */}
              {expanded === exam.examPaperId && (
                <div className="border-t border-outline-variant/30 px-4 py-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant/20">
                        <th className="text-left font-label-caps text-[10px] text-on-surface-variant uppercase py-2">
                          Periode
                        </th>
                        <th className="text-right font-label-caps text-[10px] text-on-surface-variant uppercase py-2">
                          Telechargements
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.points.map((point) => (
                        <tr key={point.date} className="border-b border-outline-variant/10">
                          <td className="py-2 font-body-sm text-on-surface-variant">
                            {formatDateLabel(point.date, period)}
                          </td>
                          <td className="py-2 text-right font-body-sm text-primary tabular-nums">
                            {point.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
