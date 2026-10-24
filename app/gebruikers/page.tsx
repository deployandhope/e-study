export const dynamic = "force-dynamic";

import {
  getTeacherStats,
  fillMissingDays,
  buildCumulative,
  STATS_SITES,
  TeacherStats,
} from "../lib/stats";
import { getFacebookRegistrations } from "../lib/meta";
import TeacherGrowthChart from "../components/TeacherGrowthChart";

interface SiteResult {
  short: string;
  name: string;
  baseUrl: string;
  stats: TeacherStats | null;
  error: string | null;
}

export default async function GebruikersPage() {
  const facebookPromise = getFacebookRegistrations().catch((err) => {
    console.error("[gebruikers] Facebook failed:", err instanceof Error ? err.message : String(err));
    return null;
  });
  const results: SiteResult[] = await Promise.all(
    STATS_SITES.map(async (s) => {
      try {
        const stats = await getTeacherStats(s.baseUrl, s.statsPath);
        return { ...s, stats, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[gebruikers] ${s.short} failed:`, message);
        return { ...s, stats: null, error: message };
      }
    })
  );

  const facebook = await facebookPromise;
  const facebookTotal = (short: string) =>
    (facebook?.[short] ?? []).reduce((sum, d) => sum + d.count, 0);
  const grandTotal = results.reduce((sum, s) => sum + (s.stats?.teachers_total ?? 0), 0);
  const grandFacebook = results.reduce((sum, s) => sum + (s.stats ? facebookTotal(s.short) : 0), 0);

  return (
    <div className="p-5 flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div>
          <h1 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Totale gebruikers per website
          </h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            teacher-accounts op dit moment · live · via Facebook = Meta-attributie (1 dag na weergave / 7 dagen na klik)
          </p>
        </div>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${results.length + 1}, minmax(0, 1fr))` }}
        >
          {results.map((s) => (
            <div
              key={s.short}
              className="rounded-xl px-4 py-3"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(26,39,68,0.06)" }}
            >
              <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{s.short}</div>
              <div className="text-xl font-bold tabular-nums" style={{ color: "var(--text)" }}>
                {s.stats ? s.stats.teachers_total.toLocaleString("nl-NL") : "—"}
              </div>
              <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{s.name}</div>
              <div className="text-xs mt-1 tabular-nums" style={{ color: "#b45309" }}>
                {facebook && s.stats ? `via Facebook: ${facebookTotal(s.short).toLocaleString("nl-NL")}` : "via Facebook: —"}
              </div>
            </div>
          ))}
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "#dbeafe", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(26,39,68,0.06)" }}
          >
            <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Totaal</div>
            <div className="text-xl font-bold tabular-nums" style={{ color: "var(--primary)" }}>
              {grandTotal.toLocaleString("nl-NL")}
            </div>
            <div className="text-xs truncate" style={{ color: "var(--muted)" }}>Alle websites</div>
            <div className="text-xs mt-1 tabular-nums" style={{ color: "#b45309" }}>
              {facebook ? `via Facebook: ${grandFacebook.toLocaleString("nl-NL")}` : "via Facebook: —"}
            </div>
          </div>
        </div>
      </section>
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
        const fbByDate = Object.fromEntries((facebook?.[s.short] ?? []).map((d) => [d.date, d.count]));
        const hasFacebook = Object.keys(fbByDate).length > 0;
        let fbRunning = 0;
        const rows = filled.map((d, i) => {
          const fb = fbByDate[d.date] ?? 0;
          fbRunning += fb;
          return {
            date: d.date,
            daily: d.count,
            cumulative: cumulative[i].count,
            facebook: fb,
            facebookCumulative: fbRunning,
          };
        });
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
              showFacebook={hasFacebook}
            />
          </section>
        );
      })}
    </div>
  );
}
