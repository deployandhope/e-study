"use client";

import { useState } from "react";
import { KeywordRow } from "../lib/gsc";

interface Props {
  title: string;
  data: KeywordRow[];
  maxHeight?: number;
}

const HOVER_BG = "#1a2744";
const HOVER_TEXT = "#fbfaf3";

function formatPosition(v: number) {
  return v.toFixed(1);
}

export default function KeywordTable({ title, data, maxHeight = 320 }: Props) {
  const [hovRow, setHovRow] = useState<string | null>(null);

  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);

  function clicksBg(clicks: number): React.CSSProperties {
    const ratio = clicks / maxClicks;
    const r = Math.round(255 - ratio * (255 - 22));
    const g = Math.round(255 - ratio * (255 - 163));
    const b = Math.round(255 - ratio * (255 - 74));
    const color = ratio > 0.55 ? "#14532d" : "var(--text)";
    return { backgroundColor: `rgb(${r},${g},${b})`, color };
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-xs font-semibold" style={{ color: "var(--text)" }}>
          {title} — Top zoekwoorden
        </h2>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          clicks &amp; gemiddelde positie · afgelopen 30 dagen
        </p>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 4px rgba(26,39,68,0.06)",
        }}
        onMouseLeave={() => setHovRow(null)}
      >
        <div style={{ maxHeight, overflowY: "auto" }}>
          <table className="w-full text-xs text-left">
            <thead
              className="sticky top-0 z-10"
              style={{
                background: "#f0f4fa",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <tr>
                <th
                  className="px-3 py-1.5 font-semibold whitespace-nowrap"
                  style={{ color: "var(--muted)" }}
                >
                  Zoekwoord
                </th>
                <th
                  className="px-3 py-1.5 text-right font-semibold whitespace-nowrap"
                  style={{
                    color: "var(--text)",
                    borderLeft: "1px solid var(--border)",
                  }}
                >
                  Clicks
                </th>
                <th
                  className="px-3 py-1.5 text-right font-semibold whitespace-nowrap"
                  style={{
                    color: "var(--text)",
                    borderLeft: "1px solid var(--border)",
                  }}
                >
                  Pos.
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const stripe = i % 2 === 1 ? "#f8fafc" : "var(--card)";
                const active = hovRow === row.query;
                return (
                  <tr
                    key={row.query}
                    className="cursor-default"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: active ? HOVER_BG : stripe,
                      color: active ? HOVER_TEXT : "var(--text)",
                    }}
                    onMouseEnter={() => setHovRow(row.query)}
                  >
                    <td
                      className="px-3 py-1 font-medium"
                      style={{
                        color: active ? HOVER_TEXT : "var(--text)",
                        maxWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={row.query}
                    >
                      {row.query}
                    </td>
                    <td
                      className="px-3 py-1 text-right tabular-nums font-semibold whitespace-nowrap"
                      style={{
                        borderLeft: "1px solid var(--border)",
                        ...(active
                          ? { backgroundColor: HOVER_BG, color: HOVER_TEXT }
                          : clicksBg(row.clicks)),
                      }}
                    >
                      {row.clicks.toLocaleString("nl-NL")}
                    </td>
                    <td
                      className="px-3 py-1 text-right tabular-nums whitespace-nowrap"
                      style={{
                        borderLeft: "1px solid var(--border)",
                        color: active ? HOVER_TEXT : "var(--muted)",
                      }}
                    >
                      {formatPosition(row.position)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
