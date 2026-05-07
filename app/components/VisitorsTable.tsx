"use client";

import { useState } from "react";

interface DayData {
  date: string;
  value: number;
}

interface SiteData {
  name: string;
  data: DayData[];
}

interface Props {
  title: string;
  subtitle: string;
  sites: SiteData[];
  siteNames: string[];
  siteShorts?: string[];
  format?: "integer" | "decimal" | "duration" | "currency";
  aggregation?: "sum" | "avg";
  maxHeight?: number;
  showTotal?: boolean;
}

function formatDate(d: string) {
  const year = d.slice(0, 4), month = d.slice(4, 6), day = d.slice(6, 8);
  return new Date(`${year}-${month}-${day}`).toLocaleDateString("nl-NL", {
    weekday: "short", day: "numeric", month: "short",
  });
}

const HOVER_BG = "#1a2744";
const HOVER_TEXT = "#fbfaf3";

export default function VisitorsTable({
  title,
  subtitle,
  sites,
  siteNames,
  siteShorts,
  format = "integer",
  aggregation = "sum",
  maxHeight,
  showTotal = true,
}: Props) {
  const formatValue = (v: number) => {
    if (format === "currency") return "€ " + v.toFixed(2).replace(".", ",");
    if (format === "decimal") return v.toFixed(1);
    if (format === "duration") {
      const m = Math.floor(v / 60);
      const s = Math.round(v % 60);
      return `${m}m ${s.toString().padStart(2, "0")}s`;
    }
    return Math.round(v).toLocaleString("nl-NL");
  };
  const [hovRow, setHovRow] = useState<string | null>(null);
  const [hovCol, setHovCol] = useState<string | null>(null);

  const lookup: Record<string, Record<string, number>> = {};
  for (const site of sites) {
    lookup[site.name] = {};
    for (const d of site.data) lookup[site.name][d.date] = d.value;
  }

  const allDates = [...new Set(sites.flatMap((s) => s.data.map((d) => d.date)))].sort().reverse();

  function aggregate(values: number[]) {
    const valid = values.filter((v) => !isNaN(v));
    if (!valid.length) return 0;
    if (aggregation === "avg") return valid.reduce((a, b) => a + b, 0) / valid.length;
    return valid.reduce((a, b) => a + b, 0);
  }

  const siteTotals = Object.fromEntries(
    siteNames.map((name) => [
      name,
      aggregate(allDates.map((d) => lookup[name]?.[d] ?? 0)),
    ])
  );
  const grandTotal = aggregate(Object.values(siteTotals));

  function cellStyle(row: string, col: string, base?: React.CSSProperties) {
    const active = hovRow === row || hovCol === col;
    return active
      ? { ...base, backgroundColor: HOVER_BG, color: HOVER_TEXT }
      : { ...base, color: "var(--text)" };
  }

  function mutedCellStyle(row: string, col: string, base?: React.CSSProperties) {
    const active = hovRow === row || hovCol === col;
    return active
      ? { ...base, backgroundColor: HOVER_BG, color: HOVER_TEXT }
      : { ...base, color: "var(--muted)" };
  }

  const totColBase: React.CSSProperties = { borderLeft: "2px solid var(--border)" };
  const colBase: React.CSSProperties = { borderLeft: "1px solid var(--border)" };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</h2>
        <p className="text-xs" style={{ color: "var(--muted)" }}>{subtitle}</p>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(26,39,68,0.06)" }}
        onMouseLeave={() => { setHovRow(null); setHovCol(null); }}
      >
        <div style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 z-10" style={{ background: "#f0f4fa", borderBottom: "1px solid var(--border)" }}>
              <tr>
                <th className="px-3 py-1.5 font-semibold whitespace-nowrap" style={{ color: "var(--muted)" }}>Dag</th>
                {siteNames.map((name, i) => (
                  <th
                    key={name}
                    className="px-3 py-1.5 text-right font-semibold cursor-default"
                    style={{ ...colBase, color: hovCol === name ? HOVER_TEXT : "var(--text)", backgroundColor: hovCol === name ? HOVER_BG : undefined }}
                    onMouseEnter={() => setHovCol(name)}
                    title={name}
                  >
                    {siteShorts?.[i] ?? name}
                  </th>
                ))}
                {showTotal && (
                  <th
                    className="px-3 py-1.5 text-right font-semibold cursor-default"
                    style={{ ...totColBase, color: hovCol === "__tot__" ? HOVER_TEXT : "var(--text)", backgroundColor: hovCol === "__tot__" ? HOVER_BG : "#eef2f9" }}
                    onMouseEnter={() => setHovCol("__tot__")}
                  >
                    Totaal
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {allDates.map((date, i) => {
                const rowVals = siteNames.map((name) => lookup[name]?.[date] ?? 0);
                const rowTotal = aggregate(rowVals);
                const stripe = i % 2 === 1 ? "#f8fafc" : "var(--card)";
                return (
                  <tr
                    key={date}
                    className="cursor-default"
                    style={{ borderBottom: "1px solid var(--border)", background: hovRow === date ? undefined : stripe }}
                    onMouseEnter={() => setHovRow(date)}
                  >
                    <td className="px-3 py-1 font-medium whitespace-nowrap" style={mutedCellStyle(date, "date")}>
                      {formatDate(date)}
                    </td>
                    {siteNames.map((name) => (
                      <td
                        key={name}
                        className="px-3 py-1 text-right tabular-nums"
                        style={{ ...colBase, ...cellStyle(date, name, colBase) }}
                        onMouseEnter={() => setHovCol(name)}
                      >
                        {formatValue(lookup[name]?.[date] ?? 0)}
                      </td>
                    ))}
                    {showTotal && (
                      <td
                        className="px-3 py-1 text-right tabular-nums font-semibold whitespace-nowrap"
                        style={{
                          ...totColBase,
                          backgroundColor: hovRow === date || hovCol === "__tot__" ? HOVER_BG : "#f4f7fb",
                          color: hovRow === date || hovCol === "__tot__" ? HOVER_TEXT : "var(--text)",
                        }}
                        onMouseEnter={() => setHovCol("__tot__")}
                      >
                        {formatValue(rowTotal)}
                      </td>
                    )}
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
                <td className="px-3 py-1.5 font-semibold whitespace-nowrap" style={mutedCellStyle("__tot__", "date")}>
                  Totaal
                </td>
                {siteNames.map((name) => (
                  <td
                    key={name}
                    className="px-3 py-1.5 text-right tabular-nums font-semibold"
                    style={{ ...colBase, ...cellStyle("__tot__", name, colBase) }}
                    onMouseEnter={() => setHovCol(name)}
                  >
                    {formatValue(siteTotals[name])}
                  </td>
                ))}
                {showTotal && (
                  <td
                    className="px-3 py-1.5 text-right tabular-nums font-bold whitespace-nowrap"
                    style={{
                      ...totColBase,
                      backgroundColor: hovRow === "__tot__" || hovCol === "__tot__" ? HOVER_BG : "#dbeafe",
                      color: hovRow === "__tot__" || hovCol === "__tot__" ? HOVER_TEXT : "var(--primary)",
                    }}
                    onMouseEnter={() => setHovCol("__tot__")}
                  >
                    {formatValue(grandTotal)}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
