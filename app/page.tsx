export const dynamic = "force-dynamic";

import { getVisitorsLast7Days, PROPERTIES } from "./lib/ga4";

function formatDate(d: string) {
  const year = d.slice(0, 4);
  const month = d.slice(4, 6);
  const day = d.slice(6, 8);
  return new Date(`${year}-${month}-${day}`).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function Page() {
  const sites = await getVisitorsLast7Days();

  // Verzamel alle unieke datums gesorteerd
  const allDates = [...new Set(sites.flatMap((s) => s.data.map((d) => d.date)))].sort();

  // Lookup per site per datum
  const lookup: Record<string, Record<string, number>> = {};
  for (const site of sites) {
    lookup[site.name] = {};
    for (const d of site.data) {
      lookup[site.name][d.date] = d.users;
    }
  }

  const siteNames = PROPERTIES.map((p) => p.name);

  // Totalen per site
  const siteTotals = Object.fromEntries(
    siteNames.map((name) => [
      name,
      allDates.reduce((sum, date) => sum + (lookup[name]?.[date] ?? 0), 0),
    ])
  );

  const grandTotal = Object.values(siteTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          Alle Domeinen
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Actieve gebruikers per dag — afgelopen 7 dagen
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(26,39,68,0.06)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left px-5 py-3 font-semibold" style={{ color: "var(--muted)", width: "160px" }}>
                Dag
              </th>
              {siteNames.map((name) => (
                <th key={name} className="text-right px-5 py-3 font-semibold" style={{ color: "var(--text)" }}>
                  {name}
                </th>
              ))}
              <th className="text-right px-5 py-3 font-semibold" style={{ color: "var(--text)" }}>
                Totaal
              </th>
            </tr>
          </thead>
          <tbody>
            {allDates.map((date, i) => {
              const rowTotal = siteNames.reduce((sum, name) => sum + (lookup[name]?.[date] ?? 0), 0);
              return (
                <tr
                  key={date}
                  style={{
                    borderBottom: i < allDates.length - 1 ? "1px solid var(--border)" : undefined,
                    background: i % 2 === 1 ? "#f8fafc" : undefined,
                  }}
                >
                  <td className="px-5 py-3" style={{ color: "var(--muted)" }}>
                    {formatDate(date)}
                  </td>
                  {siteNames.map((name) => (
                    <td key={name} className="text-right px-5 py-3" style={{ color: "var(--text)" }}>
                      {(lookup[name]?.[date] ?? 0).toLocaleString("nl-NL")}
                    </td>
                  ))}
                  <td className="text-right px-5 py-3 font-semibold" style={{ color: "var(--text)" }}>
                    {rowTotal.toLocaleString("nl-NL")}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid var(--border)", background: "#f0f4fa" }}>
              <td className="px-5 py-3 font-semibold" style={{ color: "var(--text)" }}>
                Totaal
              </td>
              {siteNames.map((name) => (
                <td key={name} className="text-right px-5 py-3 font-bold" style={{ color: "var(--text)" }}>
                  {siteTotals[name].toLocaleString("nl-NL")}
                </td>
              ))}
              <td className="text-right px-5 py-3 font-bold" style={{ color: "var(--primary)" }}>
                {grandTotal.toLocaleString("nl-NL")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
