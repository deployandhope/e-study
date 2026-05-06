"use client";

import { useState } from "react";

interface DayData {
  date: string;
  users: number;
}

interface SiteData {
  name: string;
  data: DayData[];
}

interface Props {
  sites: SiteData[];
  siteNames: string[];
}

function formatDate(d: string) {
  const year = d.slice(0, 4), month = d.slice(4, 6), day = d.slice(6, 8);
  return new Date(`${year}-${month}-${day}`).toLocaleDateString("nl-NL", {
    weekday: "short", day: "numeric", month: "short",
  });
}

const HOVER_BG = "#1a2744";
const HOVER_TEXT = "#fbfaf3";

export default function VisitorsTable({ sites, siteNames }: Props) {
  const [hovRow, setHovRow] = useState<string | null>(null);
  const [hovCol, setHovCol] = useState<string | null>(null);

  const lookup: Record<string, Record<string, number>> = {};
  for (const site of sites) {
    lookup[site.name] = {};
    for (const d of site.data) lookup[site.name][d.date] = d.users;
  }

  const allDates = [...new Set(sites.flatMap((s) => s.data.map((d) => d.date)))].sort().reverse();

  const siteTotals = Object.fromEntries(
    siteNames.map((name) => [name, allDates.reduce((s, d) => s + (lookup[name]?.[d] ?? 0), 0)])
  );
  const grandTotal = Object.values(siteTotals).reduce((a, b) => a + b, 0);

  function cell(row: string, col: string) {
    const active = hovRow === row || hovCol === col;
    return {
      backgroundColor: active ? HOVER_BG : undefined,
      color: active ? HOVER_TEXT : "var(--text)",
    };
  }

  function mutedCell(row: string, col: string) {
    const active = hovRow === row || hovCol === col;
    return {
      backgroundColor: active ? HOVER_BG : undefined,
      color: active ? HOVER_TEXT : "var(--muted)",
    };
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(26,39,68,0.06)" }}
      onMouseLeave={() => { setHovRow(null); setHovCol(null); }}
    >
      <div className="overflow-auto max-h-[520px]">
        <table className="w-full text-xs text-left">
          <thead className="sticky top-0 z-10" style={{ background: "#f0f4fa", borderBottom: "1px solid var(--border)" }}>
            <tr>
              <th className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: "var(--muted)" }}>
                Dag
              </th>
              {siteNames.map((name) => (
                <th
                  key={name}
                  className="px-4 py-2.5 text-right font-semibold whitespace-nowrap cursor-default"
                  style={{
                    borderLeft: "1px solid var(--border)",
                    color: hovCol === name ? HOVER_TEXT : "var(--text)",
                    backgroundColor: hovCol === name ? HOVER_BG : undefined,
                  }}
                  onMouseEnter={() => setHovCol(name)}
                >
                  {name}
                </th>
              ))}
              <th
                className="px-4 py-2.5 text-right font-semibold whitespace-nowrap cursor-default"
                style={{
                  borderLeft: "2px solid var(--border)",
                  color: hovCol === "__tot__" ? HOVER_TEXT : "var(--text)",
                  backgroundColor: hovCol === "__tot__" ? HOVER_BG : "#eef2f9",
                }}
                onMouseEnter={() => setHovCol("__tot__")}
              >
                Totaal
              </th>
            </tr>
          </thead>
          <tbody>
            {allDates.map((date, i) => {
              const rowTotal = siteNames.reduce((s, name) => s + (lookup[name]?.[date] ?? 0), 0);
              const isHov = hovRow === date;
              const stripe = i % 2 === 1 ? "#f8fafc" : "var(--card)";
              return (
                <tr
                  key={date}
                  className="cursor-default"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: isHov ? undefined : stripe,
                  }}
                  onMouseEnter={() => setHovRow(date)}
                >
                  <td className="px-4 py-1.5 font-medium whitespace-nowrap" style={mutedCell(date, "date")}>
                    {formatDate(date)}
                  </td>
                  {siteNames.map((name) => (
                    <td
                      key={name}
                      className="px-4 py-1.5 text-right tabular-nums whitespace-nowrap"
                      style={{ borderLeft: "1px solid var(--border)", ...cell(date, name) }}
                      onMouseEnter={() => setHovCol(name)}
                    >
                      {(lookup[name]?.[date] ?? 0).toLocaleString("nl-NL")}
                    </td>
                  ))}
                  <td
                    className="px-4 py-1.5 text-right tabular-nums font-semibold whitespace-nowrap"
                    style={{
                      borderLeft: "2px solid var(--border)",
                      backgroundColor: hovRow === date || hovCol === "__tot__" ? HOVER_BG : "#f4f7fb",
                      color: hovRow === date || hovCol === "__tot__" ? HOVER_TEXT : "var(--text)",
                    }}
                    onMouseEnter={() => setHovCol("__tot__")}
                  >
                    {rowTotal.toLocaleString("nl-NL")}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr
              style={{ borderTop: "2px solid var(--border)", background: "#eef2f9" }}
              onMouseEnter={() => setHovRow("__tot__")}
              className="cursor-default"
            >
              <td className="px-4 py-2 font-semibold whitespace-nowrap" style={mutedCell("__tot__", "date")}>
                Totaal
              </td>
              {siteNames.map((name) => (
                <td
                  key={name}
                  className="px-4 py-2 text-right tabular-nums font-semibold whitespace-nowrap"
                  style={{ borderLeft: "1px solid var(--border)", ...cell("__tot__", name) }}
                  onMouseEnter={() => setHovCol(name)}
                >
                  {siteTotals[name].toLocaleString("nl-NL")}
                </td>
              ))}
              <td
                className="px-4 py-2 text-right tabular-nums font-bold whitespace-nowrap"
                style={{
                  borderLeft: "2px solid var(--border)",
                  backgroundColor: hovRow === "__tot__" || hovCol === "__tot__" ? HOVER_BG : "#dbeafe",
                  color: hovRow === "__tot__" || hovCol === "__tot__" ? HOVER_TEXT : "var(--primary)",
                }}
                onMouseEnter={() => setHovCol("__tot__")}
              >
                {grandTotal.toLocaleString("nl-NL")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
