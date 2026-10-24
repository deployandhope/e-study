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
  statsPath?: string;
}

export const STATS_SITES: StatsSite[] = [
  { short: "MTD", name: "MijnTafeldiploma", baseUrl: "https://mijntafeldiploma.nl" },
  { short: "OBL", name: "OefenBegrijpendLezen", baseUrl: "https://oefenbegrijpendlezen.nl" },
  { short: "VS", name: "Verhaalsommen", baseUrl: "https://verhaalsommen.nl" },
  { short: "MWP", name: "MathWordProblems", baseUrl: "https://mathwordproblems.com" },
  { short: "RD", name: "Rekendiploma", baseUrl: "https://rekendiploma.nl", statsPath: "/api/stats.php" },
];

export async function getTeacherStats(
  baseUrl: string,
  statsPath = "/wp-json/estudy-stats/v1/teachers"
): Promise<TeacherStats> {
  const token = process.env.ESTUDY_STATS_TOKEN;
  if (!token) throw new Error("ESTUDY_STATS_TOKEN ontbreekt");

  // Het token alleen in de header: in de URL komt het in de toegangslogs van de sites terecht.
  const url = `${baseUrl}${statsPath}`;
  const res = await fetch(url, {
    headers: { "X-Estudy-Token": token },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    const detail = body.trimStart().startsWith("<") ? "" : ` ${body.slice(0, 200)}`;
    throw new Error(`eStudy stats fout (${baseUrl}${statsPath}): ${res.status}${detail}`);
  }
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

/** Eén account uit /api/registraties.php van MijnTafeldiploma (opruimplan fase R): wat de database bij de registratie bewaart. */
export interface Registratie {
  id: number;
  geregistreerd_op: string; // UTC, "jjjj-mm-dd uu:mm:ss"
  rol: "leerkracht" | "ouder";
  laatste_login: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_campaign_name: string | null;
  utm_adset: string | null;
  utm_medium: string | null;
  fbclid: boolean;
  klassen: number;
}

/** De registraties van MijnTafeldiploma, nieuwste eerst; zelfde token als de stats, alleen in de header. */
export async function getMtdRegistraties(): Promise<Registratie[]> {
  const token = process.env.ESTUDY_STATS_TOKEN;
  if (!token) throw new Error("ESTUDY_STATS_TOKEN ontbreekt");
  const res = await fetch("https://mijntafeldiploma.nl/api/registraties.php", {
    headers: { "X-Estudy-Token": token },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`MTD registraties fout: ${res.status}`);
  const data = (await res.json()) as { registraties: Registratie[] };
  return data.registraties;
}

export interface RegistratieGroep {
  bron: string;
  campagne: string;
  adset: string;
  leerkrachten: number;
  ouders: number;
  metKlas: number;
  metFbclid: number;
  laatste: string;
}

/** Per bron, campagne en advertentieset: hoeveel leerkrachten en ouders, hoeveel met een klas; meeste registraties eerst. */
export function groepeerRegistraties(registraties: Registratie[]): RegistratieGroep[] {
  const groepen = new Map<string, RegistratieGroep>();
  for (const r of registraties) {
    const bron = r.utm_source ?? (r.fbclid ? "facebook (alleen fbclid)" : "geen");
    const campagne = r.utm_campaign_name ?? r.utm_campaign ?? "—";
    const adset = r.utm_adset ?? "—";
    const sleutel = `${bron}\u0000${campagne}\u0000${adset}`;
    const g = groepen.get(sleutel) ?? { bron, campagne, adset, leerkrachten: 0, ouders: 0, metKlas: 0, metFbclid: 0, laatste: r.geregistreerd_op };
    if (r.rol === "leerkracht") g.leerkrachten++;
    else g.ouders++;
    if (r.klassen > 0) g.metKlas++;
    if (r.fbclid) g.metFbclid++;
    if (r.geregistreerd_op > g.laatste) g.laatste = r.geregistreerd_op;
    groepen.set(sleutel, g);
  }
  return [...groepen.values()].sort((a, b) => b.leerkrachten + b.ouders - (a.leerkrachten + a.ouders) || (a.laatste < b.laatste ? 1 : -1));
}
