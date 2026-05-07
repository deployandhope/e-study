"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MonthEarnings } from "../lib/adsense";

interface Props {
  data: MonthEarnings[];
}

const PRIMARY = "#2563eb";
const CURRENT_MONTH = "#1a2744";

function formatEuro(v: number) {
  return "€ " + v.toFixed(2).replace(".", ",");
}

export default function EarningsChart({ data }: Props) {
  const lastIdx = data.length - 1;

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-xs font-semibold" style={{ color: "var(--text)" }}>
          AdSense — maandelijkse inkomsten
        </h2>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          estimatedEarnings per maand (EUR) · afgelopen 36 maanden
        </p>
      </div>
      <div
        className="rounded-xl p-4"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 4px rgba(26,39,68,0.06)",
        }}
      >
        <ResponsiveContainer width="100%" height={238}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 50, left: 8 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              angle={-45}
              textAnchor="end"
              interval={2}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${v}`}
              width={40}
            />
            <Tooltip
              formatter={(value) => [formatEuro(Number(value)), "Inkomsten"]}
              contentStyle={{
                background: "#1a2744",
                border: "none",
                borderRadius: 8,
                color: "#fbfaf3",
                fontSize: 12,
              }}
              itemStyle={{ color: "#fbfaf3" }}
              labelStyle={{ color: "#fbfaf3", fontWeight: 600 }}
              cursor={{ fill: "rgba(26,39,68,0.06)" }}
            />
            <Bar dataKey="earnings" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === lastIdx ? CURRENT_MONTH : PRIMARY} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
