import { OAuth2Client } from "google-auth-library";

export interface KeywordRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCSite {
  name: string;
  short: string;
  siteUrl: string;
}

export const GSC_SITES: GSCSite[] = [
  { name: "OefenBegrijpendLezen", short: "OBL", siteUrl: "https://oefenbegrijpendlezen.nl/" },
  { name: "Verhaalsommen", short: "VS", siteUrl: "https://verhaalsommen.nl/" },
  { name: "MijnTafeldiploma", short: "MTD", siteUrl: "https://mijntafeldiploma.nl/" },
  { name: "MathWordProblems", short: "MWP", siteUrl: "https://mathwordproblems.com/" },
];

async function getGscToken(): Promise<string> {
  const auth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GSC_REFRESH_TOKEN });
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("Kon geen GSC access token ophalen");
  return token;
}

export interface DayClicks {
  date: string;
  [siteShort: string]: number | string;
}

export async function getClicksPerDay(
  siteUrl: string,
  days: number
): Promise<{ date: string; clicks: number }[]> {
  const token = await getGscToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ["date"],
        rowLimit: 1000,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`GSC daily-fout (${siteUrl}): ${await res.text()}`);

  const json = await res.json();
  return (json.rows ?? []).map(
    (row: { keys: string[]; clicks: number }) => ({
      date: row.keys[0],
      clicks: row.clicks,
    })
  );
}

export async function getCombinedClicksPerDay(days: number): Promise<DayClicks[]> {
  const perSite = await Promise.all(
    GSC_SITES.map(async (s) => ({
      short: s.short,
      data: await getClicksPerDay(s.siteUrl, days),
    }))
  );

  const dateMap: Record<string, DayClicks> = {};
  for (const { short, data } of perSite) {
    for (const d of data) {
      if (!dateMap[d.date]) dateMap[d.date] = { date: d.date };
      dateMap[d.date][short] = d.clicks;
    }
  }

  return Object.values(dateMap).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );
}

export async function getTopQueries(
  siteUrl: string,
  days: number,
  limit: number
): Promise<KeywordRow[]> {
  const token = await getGscToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ["query"],
        rowLimit: limit,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`GSC fout (${siteUrl}): ${await res.text()}`);

  const json = await res.json();
  return (json.rows ?? []).map(
    (row: {
      keys: string[];
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })
  );
}
