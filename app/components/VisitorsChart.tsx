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

interface DataPoint {
  date: string;
  users: number;
}

interface Props {
  name: string;
  data: DataPoint[];
  color: string;
}

function formatDate(d: string) {
  return `${d.slice(6, 8)}/${d.slice(4, 6)}`;
}

export default function VisitorsChart({ name, data, color }: Props) {
  const total = data.reduce((sum, d) => sum + d.users, 0);
  const formatted = data.map((d) => ({ ...d, date: formatDate(d.date) }));

  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-4"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 4px rgba(26,39,68,0.06)",
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>
          {name}
        </p>
        <p className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          {total.toLocaleString("nl-NL")}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
          bezoekers afgelopen 7 dagen
        </p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9eef6" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={36} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1a2744", border: "none", borderRadius: 8, color: "#fbfaf3", fontSize: 12 }}
            formatter={(v) => [Number(v).toLocaleString("nl-NL"), "Bezoekers"]}
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
