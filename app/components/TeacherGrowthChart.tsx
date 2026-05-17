"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Row {
  date: string;
  daily: number;
  cumulative: number;
}

interface Props {
  title: string;
  subtitle: string;
  data: Row[];
}

const PRIMARY = "#2563eb";

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return new Date(`${y}-${m}-${day}`).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

interface TooltipPayloadItem {
  value?: number;
  payload?: Row;
}

function CustomTooltip({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  mode: "cumulative" | "daily";
}) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  if (!row) return null;
  return (
    <div
      style={{
        background: "#1a2744",
        borderRadius: 8,
        color: "#fbfaf3",
        fontSize: 11,
        padding: "8px 10px",
        lineHeight: 1.45,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label ? formatDate(label) : ""}</div>
      <div>
        {mode === "cumulative" ? "Totaal: " : "Nieuw: "}
        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {(mode === "cumulative" ? row.cumulative : row.daily).toLocaleString("nl-NL")}
        </span>
      </div>
    </div>
  );
}

export default function TeacherGrowthChart({ title, subtitle, data }: Props) {
  const [mode, setMode] = useState<"cumulative" | "daily">("cumulative");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        </div>
        <div
          className="inline-flex rounded-md text-xs overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setMode("cumulative")}
            className="px-2.5 py-1 transition-colors"
            style={{
              background: mode === "cumulative" ? "var(--primary)" : "transparent",
              color: mode === "cumulative" ? "white" : "var(--muted)",
            }}
          >
            Cumulatief
          </button>
          <button
            onClick={() => setMode("daily")}
            className="px-2.5 py-1 transition-colors"
            style={{
              background: mode === "daily" ? "var(--primary)" : "transparent",
              color: mode === "daily" ? "white" : "var(--muted)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            Per dag
          </button>
        </div>
      </div>
      <div
        className="rounded-xl p-3"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 4px rgba(26,39,68,0.06)",
        }}
      >
        <ResponsiveContainer width="100%" height={320}>
          {mode === "cumulative" ? (
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 30, left: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 9, fill: "var(--muted)" }}
                angle={-45}
                textAnchor="end"
                interval={Math.max(1, Math.floor(data.length / 20))}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ stroke: "var(--border)" }} />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke={PRIMARY}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 30, left: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 9, fill: "var(--muted)" }}
                angle={-45}
                textAnchor="end"
                interval={Math.max(1, Math.floor(data.length / 20))}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: "rgba(26,39,68,0.06)" }} />
              <Bar dataKey="daily" fill={PRIMARY} isAnimationActive={false} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
