export const dynamic = "force-dynamic";

import {
  getTeacherStats,
  fillMissingDays,
  buildCumulative,
  STATS_SITES,
  TeacherStats,
} from "../lib/stats";
import TeacherGrowthChart from "../components/TeacherGrowthChart";

interface SiteResult {
  short: string;
  name: string;
  baseUrl: string;
  stats: TeacherStats | null;
  error: string | null;
}

export default async function GebruikersPage() {
  const results: SiteResult[] = await Promise.all(
    STATS_SITES.map(async (s) => {
      try {
        const stats = await getTeacherStats(s.baseUrl);
        return { ...s, stats, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[gebruikers] ${s.short} failed:`, message);
        return { ...s, stats: null, error: message };
      }
    })
  );

  return (
    <div className="p-5 flex flex-col gap-6">
      {results.map((s) => {
        if (!s.stats) {
          return (
            <section key={s.short} className="flex flex-col gap-2">
              <h1 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                {s.name} — teacher-registraties
              </h1>
              <div
                className="rounded-xl p-4 text-xs"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                Kon data niet ophalen: {s.error}
              </div>
            </section>
          );
        }
        const filled = fillMissingDays(s.stats.daily);
        const cumulative = buildCumulative(filled);
        const rows = filled.map((d, i) => ({
          date: d.date,
          daily: d.count,
          cumulative: cumulative[i].count,
        }));
        return (
          <section key={s.short} className="flex flex-col gap-4">
            <div>
              <h1 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                {s.name} — teacher-registraties
              </h1>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {s.stats.teachers_total.toLocaleString("nl-NL")} teachers totaal · live
                vanaf {s.stats.daily[0]?.date ?? "—"} tot{" "}
                {s.stats.daily[s.stats.daily.length - 1]?.date ?? "—"}
              </p>
            </div>
            <TeacherGrowthChart
              title={`${s.name} — verloop`}
              subtitle="Toggle tussen cumulatief en nieuw per dag"
              data={rows}
            />
          </section>
        );
      })}
    </div>
  );
}
