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
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {total.toLocaleString("nl-NL")}
        </p>
        <p className="text-sm text-gray-500">bezoekers afgelopen 7 dagen</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={40} />
          <Tooltip
            formatter={(v) => [Number(v).toLocaleString("nl-NL"), "Bezoekers"]}
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
