export interface DailyCount {
  date: string;
  count: number;
}

export interface TeacherStats {
  site: string;
  teachers_total: number;
  daily: DailyCount[];
}

export interface StatsSite {
  short: string;
  name: string;
  baseUrl: string;
}

export const STATS_SITES: StatsSite[] = [
  { short: "MTD", name: "MijnTafeldiploma", baseUrl: "https://mijntafeldiploma.nl" },
  { short: "OBL", name: "OefenBegrijpendLezen", baseUrl: "https://oefenbegrijpendlezen.nl" },
  { short: "VS", name: "Verhaalsommen", baseUrl: "https://verhaalsommen.nl" },
  { short: "MWP", name: "MathWordProblems", baseUrl: "https://mathwordproblems.com" },
];

export async function getTeacherStats(baseUrl: string): Promise<TeacherStats> {
  const token = process.env.ESTUDY_STATS_TOKEN;
  if (!token) throw new Error("ESTUDY_STATS_TOKEN ontbreekt");

  const url = `${baseUrl}/wp-json/estudy-stats/v1/teachers?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    headers: { "X-Estudy-Token": token },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`eStudy stats fout (${baseUrl}): ${res.status} ${await res.text()}`);
  return (await res.json()) as TeacherStats;
}

export function buildCumulative(daily: DailyCount[]): DailyCount[] {
  let total = 0;
  return daily.map((d) => {
    total += d.count;
    return { date: d.date, count: total };
  });
}

export function fillMissingDays(daily: DailyCount[]): DailyCount[] {
  if (daily.length === 0) return [];
  const start = new Date(daily[0].date + "T00:00:00");
  const end = new Date(daily[daily.length - 1].date + "T00:00:00");
  const byDate: Record<string, number> = {};
  for (const d of daily) byDate[d.date] = d.count;
  const result: DailyCount[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    result.push({ date: iso, count: byDate[iso] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
