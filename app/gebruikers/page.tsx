export const dynamic = "force-dynamic";

import { getTeacherStats, fillMissingDays, buildCumulative, STATS_SITES } from "../lib/stats";
import TeacherGrowthChart from "../components/TeacherGrowthChart";

export default async function GebruikersPage() {
  const sites = await Promise.all(
    STATS_SITES.map(async (s) => ({
      ...s,
      stats: await getTeacherStats(s.baseUrl),
    }))
  );

  return (
    <div className="p-5 flex flex-col gap-6">
      {sites.map((s) => {
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
                vanaf {s.stats.daily[0]?.date ?? "—"} tot {s.stats.daily[s.stats.daily.length - 1]?.date ?? "—"}
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
