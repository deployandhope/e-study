"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

function ColumnInfoIcon({ items }: { items: string[] }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function open(e: React.MouseEvent) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: r.right + 4, y: r.top });
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPos(null), 150);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <>
      <span
        className="inline-flex cursor-help"
        onMouseEnter={open}
        onMouseLeave={scheduleClose}
      >
        <Info className="w-3 h-3" style={{ color: "var(--muted)" }} />
      </span>
      {pos !== null && typeof document !== "undefined" &&
        createPortal(
          <div
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.y,
              zIndex: 9999,
              background: "#1a2744",
              color: "#fbfaf3",
              borderRadius: 8,
              fontSize: 11,
              padding: "8px 10px",
              maxHeight: 320,
              minWidth: 220,
              maxWidth: 360,
              overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              userSelect: "text",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>
              {items.length} pagina{items.length === 1 ? "" : "'s"}
            </div>
            {items.map((p) => (
              <div key={p} style={{ lineHeight: 1.5, fontVariantNumeric: "tabular-nums" }}>
                {p === "" ? "(leeg)" : p}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

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
  conditionalTotal?: boolean;
  dateFormat?: "day" | "month";
  dateLabel?: string;
  showPercentageRow?: boolean;
  showRowPercentage?: boolean;
  headerRight?: React.ReactNode;
  columnInfo?: Record<string, string[]>;
  compact?: boolean;
}

const NL_MONTHS_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function formatDay(d: string) {
  const year = d.slice(0, 4), month = d.slice(4, 6), day = d.slice(6, 8);
  return new Date(`${year}-${month}-${day}`).toLocaleDateString("nl-NL", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function formatMonth(d: string) {
  const year = d.slice(0, 4);
  const monthIdx = parseInt(d.slice(4, 6), 10) - 1;
  return `${NL_MONTHS_SHORT[monthIdx] ?? "?"} '${year.slice(2)}`;
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
  conditionalTotal = false,
  dateFormat = "day",
  dateLabel = "Dag",
  showPercentageRow = false,
  showRowPercentage = false,
  headerRight,
  columnInfo,
  compact = false,
}: Props) {
  const padHead = compact ? "px-2 py-0.5" : "px-3 py-1.5";
  const padBody = compact ? "px-2 py-0" : "px-3 py-1";
  const padFoot = compact ? "px-2 py-0.5" : "px-3 py-1.5";
  const formatDate = dateFormat === "month" ? formatMonth : formatDay;
  const formatValue = (v: number) => {
    if (format === "currency")
      return compact
        ? "€ " + Math.round(v).toLocaleString("nl-NL")
        : "€ " + v.toFixed(2).replace(".", ",");
    if (format === "decimal") return v.toFixed(1);
    if (format === "duration") {
      const m = Math.floor(v / 60);
      const s = Math.round(v % 60);
      return `${m}m ${s.toString().padStart(2, "0")}s`;
    }
    return Math.round(v).toLocaleString("nl-NL");
  };
  const formatPct = (v: number) =>
    (compact ? Math.round(v).toString() : v.toFixed(1).replace(".", ",")) + "%";
  const fullPct = compact ? "100%" : "100,0%";
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

  const rowTotals = allDates.map((date) =>
    aggregate(siteNames.map((name) => lookup[name]?.[date] ?? 0))
  );
  const minTotal = Math.min(...rowTotals);
  const maxTotal = Math.max(...rowTotals);

  function totalCellBg(value: number): React.CSSProperties {
    if (!conditionalTotal || maxTotal === minTotal) return {};
    const ratio = (value - minTotal) / (maxTotal - minTotal);
    const r = Math.round(255 - ratio * (255 - 22));
    const g = Math.round(255 - ratio * (255 - 163));
    const b = Math.round(255 - ratio * (255 - 74));
    const textColor = ratio > 0.55 ? "#14532d" : "var(--text)";
    return { backgroundColor: `rgb(${r},${g},${b})`, color: textColor };
  }

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</h2>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{subtitle}</p>
        </div>
        {headerRight}
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
                <th className={`${padHead} font-semibold whitespace-nowrap`} style={{ color: "var(--muted)" }}>{dateLabel}</th>
                {siteNames.map((name, i) => (
                  <th
                    key={name}
                    className={`${padHead} text-right font-semibold cursor-default`}
                    style={{ ...colBase, color: hovCol === name ? HOVER_TEXT : "var(--text)", backgroundColor: hovCol === name ? HOVER_BG : undefined }}
                    onMouseEnter={() => setHovCol(name)}
                    title={name}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">
                      {siteShorts?.[i] ?? name}
                      {columnInfo?.[name] && columnInfo[name].length > 0 && (
                        <ColumnInfoIcon items={columnInfo[name]} />
                      )}
                    </span>
                  </th>
                ))}
                {showTotal && (
                  <th
                    className={`${padHead} text-right font-semibold cursor-default`}
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
                    <td className={`${padBody} font-medium whitespace-nowrap`} style={mutedCellStyle(date, "date")}>
                      {formatDate(date)}
                    </td>
                    {siteNames.map((name) => {
                      const v = lookup[name]?.[date] ?? 0;
                      const pct = rowTotal > 0 ? (v / rowTotal) * 100 : 0;
                      const active = hovRow === date || hovCol === name;
                      return (
                        <td
                          key={name}
                          className={`${padBody} text-right tabular-nums`}
                          style={{ ...colBase, ...cellStyle(date, name, colBase) }}
                          onMouseEnter={() => setHovCol(name)}
                        >
                          {showRowPercentage ? (
                            <span className="inline-flex gap-1.5 items-baseline justify-end">
                              <span>{formatValue(v)}</span>
                              <span
                                className="text-[10px]"
                                style={{
                                  color: active ? "rgba(251,250,243,0.7)" : "var(--muted)",
                                }}
                              >
                                {formatPct(pct)}
                              </span>
                            </span>
                          ) : (
                            formatValue(v)
                          )}
                        </td>
                      );
                    })}
                    {showTotal && (
                      <td
                        className={`${padBody} text-right tabular-nums font-semibold whitespace-nowrap`}
                        style={{
                          ...totColBase,
                          ...(hovRow === date || hovCol === "__tot__"
                            ? { backgroundColor: HOVER_BG, color: HOVER_TEXT }
                            : conditionalTotal
                            ? totalCellBg(rowTotal)
                            : { backgroundColor: "#f4f7fb", color: "var(--text)" }),
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
                <td className={`${padFoot} font-semibold whitespace-nowrap`} style={mutedCellStyle("__tot__", "date")}>
                  Totaal
                </td>
                {siteNames.map((name) => (
                  <td
                    key={name}
                    className={`${padFoot} text-right tabular-nums font-semibold`}
                    style={{ ...colBase, ...cellStyle("__tot__", name, colBase) }}
                    onMouseEnter={() => setHovCol(name)}
                  >
                    {formatValue(siteTotals[name])}
                  </td>
                ))}
                {showTotal && (
                  <td
                    className={`${padFoot} text-right tabular-nums font-bold whitespace-nowrap`}
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
              {showPercentageRow && (() => {
                const pctRowTotal = aggregation === "avg"
                  ? aggregate(Object.values(siteTotals))
                  : Object.values(siteTotals).reduce((a, b) => a + b, 0);
                const pct = (v: number) =>
                  pctRowTotal > 0 ? (v / pctRowTotal) * 100 : 0;
                return (
                  <tr style={{ background: "#eef2f9" }} className="cursor-default">
                    <td
                      className={`${padBody} text-xs whitespace-nowrap`}
                      style={{ color: "var(--muted)" }}
                    >
                      % van totaal
                    </td>
                    {siteNames.map((name) => (
                      <td
                        key={name}
                        className={`${padBody} text-right tabular-nums`}
                        style={{ ...colBase, color: "var(--muted)" }}
                      >
                        {formatPct(pct(siteTotals[name]))}
                      </td>
                    ))}
                    {showTotal && (
                      <td
                        className={`${padBody} text-right tabular-nums whitespace-nowrap`}
                        style={{ ...totColBase, color: "var(--muted)" }}
                      >
                        {fullPct}
                      </td>
                    )}
                  </tr>
                );
              })()}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
