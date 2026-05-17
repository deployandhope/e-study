"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
export interface DailyMultiSiteRow {
  date: string;
  [siteShort: string]: number | string;
}

export interface SiteDef {
  short: string;
  name: string;
  color: string;
}

const DEFAULT_SITES: SiteDef[] = [
  { short: "OBL", name: "OefenBegrijpendLezen", color: "#2563eb" },
  { short: "VS", name: "Verhaalsommen", color: "#14b8a6" },
  { short: "MTD", name: "MijnTafeldiploma", color: "#f97316" },
  { short: "MWP", name: "MathWordProblems", color: "#ec4899" },
];

interface Props {
  title: string;
  subtitle: string;
  data: DailyMultiSiteRow[];
  xInterval?: number;
  sites?: SiteDef[];
  format?: "integer" | "currency";
}

function formatValue(v: number, format: "integer" | "currency") {
  if (format === "currency") return "€ " + v.toFixed(2).replace(".", ",");
  return v.toLocaleString("nl-NL");
}

function formatAxis(v: number, format: "integer" | "currency") {
  const prefix = format === "currency" ? "€" : "";
  if (v >= 1000) return `${prefix}${(v / 1000).toFixed(0)}k`;
  return `${prefix}${v}`;
}

function formatXDate(d: string) {
  const year = d.slice(0, 4),
    month = d.slice(5, 7),
    day = d.slice(8, 10);
  return new Date(`${year}-${month}-${day}`).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
}

interface TooltipPayloadItem {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  format = "integer",
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  format?: "integer" | "currency";
}) {
  if (!active || !payload || !payload.length) return null;
  const total = payload.reduce((s, p) => s + (Number(p.value) || 0), 0);
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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {label ? formatXDate(label) : ""}
      </div>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.color,
            }}
          />
          <span style={{ flex: 1 }}>{p.name}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatValue(Number(p.value), format)}
          </span>
        </div>
      ))}
      <div
        style={{
          marginTop: 4,
          paddingTop: 4,
          borderTop: "1px solid rgba(251,250,243,0.2)",
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Totaal</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatValue(total, format)}
        </span>
      </div>
    </div>
  );
}

export default function ClicksLineChart({
  title,
  subtitle,
  data,
  xInterval = 6,
  sites = DEFAULT_SITES,
  format = "integer",
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-xs font-semibold" style={{ color: "var(--text)" }}>
          {title}
        </h2>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {subtitle}
        </p>
      </div>
      <div
        className="rounded-xl p-3"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 4px rgba(26,39,68,0.06)",
        }}
      >
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 pl-1">
          {sites.map((s) => (
            <div key={s.short} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: s.color }}
              />
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 30, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXDate}
              tick={{ fontSize: 9, fill: "var(--muted)" }}
              angle={-45}
              textAnchor="end"
              interval={xInterval}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={(v) => formatAxis(v, format)}
            />
            <Tooltip
              content={<CustomTooltip format={format} />}
              cursor={{ stroke: "var(--border)" }}
            />
            {sites.map((s) => (
              <Line
                key={s.short}
                type="monotone"
                dataKey={s.short}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
