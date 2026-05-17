"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChannelMonthData } from "../lib/ga4";

const CHANNEL_COLORS: Record<string, string> = {
  "Organic Search": "#3b82f6",
  "Direct": "#14b8a6",
  "Referral": "#f97316",
  "Organic Social": "#ec4899",
  "Unassigned": "#eab308",
  "Paid Search": "#f59e0b",
  "Paid Social": "#a855f7",
  "Email": "#22c55e",
  "Display": "#06b6d4",
  "Video": "#8b5cf6",
  "Affiliates": "#84cc16",
  "Organic Shopping": "#10b981",
  "Paid Shopping": "#f43f5e",
  "Cross-network": "#6366f1",
  "Organic Video": "#7c3aed",
};

interface Props {
  title: string;
  data: ChannelMonthData[];
  channels: string[];
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
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload
        .slice()
        .reverse()
        .map((p) => {
          const v = Number(p.value) || 0;
          const pct = total > 0 ? (v / total) * 100 : 0;
          return (
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
                {v.toLocaleString("nl-NL")}
              </span>
              <span
                style={{
                  opacity: 0.7,
                  minWidth: 42,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
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
          {total.toLocaleString("nl-NL")}
        </span>
      </div>
    </div>
  );
}

export default function ChannelChart({ title, data, channels }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold" style={{ color: "var(--text)" }}>
        {title} — Users per channel
      </h2>
      <div
        className="rounded-xl p-3"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 4px rgba(26,39,68,0.06)",
        }}
      >
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 pl-1">
          {channels.map((ch) => (
            <div key={ch} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: CHANNEL_COLORS[ch] ?? "#888888" }}
              />
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                {ch}
              </span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 2, right: 4, bottom: 30, left: 0 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9, fill: "var(--muted)" }}
              angle={-45}
              textAnchor="end"
              interval={1}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(26,39,68,0.06)" }}
            />
            {channels.map((ch) => (
              <Bar
                key={ch}
                dataKey={ch}
                stackId="a"
                fill={CHANNEL_COLORS[ch] ?? "#888888"}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
