import { OAuth2Client } from "google-auth-library";
import { SiteData, DayData } from "./ga4";

export interface MonthEarnings {
  month: string; // "mei '23"
  earnings: number;
}

const ADSENSE_ACCOUNT = "accounts/pub-6978384984633173";

const DOMAIN_MAP: Record<string, string> = {
  "oefenbegrijpendlezen.nl": "OefenBegrijpendLezen",
  "verhaalsommen.nl": "Verhaalsommen",
  "mathwordproblems.com": "MathWordProblems",
};

export const ADSENSE_SITE_NAMES = ["OefenBegrijpendLezen", "Verhaalsommen", "MathWordProblems"];
export const ADSENSE_SITE_SHORTS = ["OBL", "VS", "MWP"];

async function getAdsenseToken(): Promise<string> {
  const auth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.ADSENSE_REFRESH_TOKEN });
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("Kon geen AdSense access token ophalen");
  return token;
}

export async function getAdsenseMonthlyEarnings(months: number): Promise<MonthEarnings[]> {
  const token = await getAdsenseToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const qs = [
    "dateRange=CUSTOM",
    `startDate.year=${start.getFullYear()}`,
    `startDate.month=${start.getMonth() + 1}`,
    `startDate.day=${start.getDate()}`,
    `endDate.year=${end.getFullYear()}`,
    `endDate.month=${end.getMonth() + 1}`,
    `endDate.day=${end.getDate()}`,
    "metrics=ESTIMATED_EARNINGS",
    "dimensions=MONTH",
    "orderBy=%2BMONTH",
  ].join("&");

  const res = await fetch(
    `https://adsense.googleapis.com/v2/${ADSENSE_ACCOUNT}/reports:generate?${qs}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`AdSense maand-fout: ${await res.text()}`);

  const json = await res.json();
  const NL_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

  return (json.rows ?? []).map((row: { cells: { value: string }[] }) => {
    const raw = row.cells[0].value; // "202605" or "2026-05"
    const clean = raw.replace("-", ""); // normalize to "202605"
    const year = clean.slice(0, 4);
    const monthIdx = parseInt(clean.slice(4, 6), 10) - 1;
    return {
      month: `${NL_MONTHS[monthIdx] ?? raw} '${year.slice(2)}`,
      earnings: parseFloat(row.cells[1].value ?? "0"),
    };
  });
}

export async function getAdsenseEarnings(days: number): Promise<SiteData[]> {
  const token = await getAdsenseToken();

  const qs = [
    `dateRange=LAST_${days}_DAYS`,
    "metrics=ESTIMATED_EARNINGS",
    "dimensions=DATE",
    "dimensions=DOMAIN_NAME",
    "orderBy=%2BDATE",
  ].join("&");

  const res = await fetch(
    `https://adsense.googleapis.com/v2/${ADSENSE_ACCOUNT}/reports:generate?${qs}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`AdSense API fout: ${await res.text()}`);

  const json = await res.json();

  const byDomain: Record<string, DayData[]> = {};

  for (const row of json.rows ?? []) {
    const rawDate: string = row.cells[0].value; // "2026-05-01"
    const domain: string = row.cells[1].value;
    const earnings = parseFloat(row.cells[2].value ?? "0");
    const siteName = DOMAIN_MAP[domain];
    if (!siteName) continue;
    const date = rawDate.replace(/-/g, ""); // → "20260501"
    if (!byDomain[siteName]) byDomain[siteName] = [];
    byDomain[siteName].push({ date, value: earnings });
  }

  return ADSENSE_SITE_NAMES.map((name) => ({
    name,
    data: byDomain[name] ?? [],
  }));
}
