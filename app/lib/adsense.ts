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
    const raw = row.cells[0].value;
    const clean = raw.replace("-", "");
    const year = clean.slice(0, 4);
    const monthIdx = parseInt(clean.slice(4, 6), 10) - 1;
    return {
      month: `${NL_MONTHS[monthIdx] ?? raw} '${year.slice(2)}`,
      earnings: parseFloat(row.cells[1].value ?? "0"),
    };
  });
}

const DOMAIN_TO_SHORT: Record<string, string> = {
  "oefenbegrijpendlezen.nl": "OBL",
  "verhaalsommen.nl": "VS",
  "mathwordproblems.com": "MWP",
};

export interface DailyEarningsRow {
  date: string;
  [siteShort: string]: number | string;
}

export async function getAdsenseDailyByDomain(days: number): Promise<DailyEarningsRow[]> {
  const token = await getAdsenseToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1);

  const qs = [
    "dateRange=CUSTOM",
    `startDate.year=${start.getFullYear()}`,
    `startDate.month=${start.getMonth() + 1}`,
    `startDate.day=${start.getDate()}`,
    `endDate.year=${end.getFullYear()}`,
    `endDate.month=${end.getMonth() + 1}`,
    `endDate.day=${end.getDate()}`,
    "metrics=ESTIMATED_EARNINGS",
    "dimensions=DATE",
    "dimensions=DOMAIN_NAME",
    "orderBy=%2BDATE",
  ].join("&");

  const res = await fetch(
    `https://adsense.googleapis.com/v2/${ADSENSE_ACCOUNT}/reports:generate?${qs}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`AdSense daily-domain fout: ${await res.text()}`);

  const json = await res.json();
  const dateMap: Record<string, DailyEarningsRow> = {};

  for (const row of json.rows ?? []) {
    const rawDate: string = row.cells[0].value;
    const domain: string = row.cells[1].value;
    const earnings = parseFloat(row.cells[2].value ?? "0");
    const short = DOMAIN_TO_SHORT[domain];
    if (!short) continue;

    if (!dateMap[rawDate]) dateMap[rawDate] = { date: rawDate };
    dateMap[rawDate][short] = earnings;
  }

  return Object.values(dateMap).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );
}

export async function getAdsenseEarningsByMonthAndPath(
  domain: string,
  months: number
): Promise<{ month: string; path: string; value: number }[]> {
  const token = await getAdsenseToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);

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
    "dimensions=PAGE_URL",
    `filters=${encodeURIComponent(`DOMAIN_NAME==${domain}`)}`,
    "limit=50000",
  ].join("&");

  const res = await fetch(
    `https://adsense.googleapis.com/v2/${ADSENSE_ACCOUNT}/reports:generate?${qs}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`AdSense month-path fout: ${await res.text()}`);

  const json = await res.json();
  return (json.rows ?? []).map((row: { cells: { value: string }[] }) => {
    const monthRaw = row.cells[0].value; // "2026-01" or "202601"
    const month = monthRaw.replace(/-/g, "");
    const url = row.cells[1].value;
    let path = url;
    try {
      path = new URL(url).pathname;
    } catch {}
    return { month, path, value: parseFloat(row.cells[2].value ?? "0") };
  });
}

export async function getAdsenseEarningsByPath(
  domain: string,
  days: number
): Promise<{ path: string; value: number }[]> {
  const token = await getAdsenseToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1);

  const qs = [
    "dateRange=CUSTOM",
    `startDate.year=${start.getFullYear()}`,
    `startDate.month=${start.getMonth() + 1}`,
    `startDate.day=${start.getDate()}`,
    `endDate.year=${end.getFullYear()}`,
    `endDate.month=${end.getMonth() + 1}`,
    `endDate.day=${end.getDate()}`,
    "metrics=ESTIMATED_EARNINGS",
    "dimensions=PAGE_URL",
    `filters=${encodeURIComponent(`DOMAIN_NAME==${domain}`)}`,
    "limit=10000",
  ].join("&");

  const res = await fetch(
    `https://adsense.googleapis.com/v2/${ADSENSE_ACCOUNT}/reports:generate?${qs}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`AdSense path-fout: ${await res.text()}`);

  const json = await res.json();
  return (json.rows ?? []).map(
    (row: { cells: { value: string }[] }) => {
      const url = row.cells[0].value;
      let path = url;
      try {
        path = new URL(url).pathname;
      } catch {
        // keep url as-is
      }
      return { path, value: parseFloat(row.cells[1].value ?? "0") };
    }
  );
}

export async function getAdsenseMonthlyByDomain(months: number): Promise<SiteData[]> {
  const token = await getAdsenseToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);

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
    "dimensions=DOMAIN_NAME",
    "orderBy=%2BMONTH",
  ].join("&");

  const res = await fetch(
    `https://adsense.googleapis.com/v2/${ADSENSE_ACCOUNT}/reports:generate?${qs}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`AdSense maand-domein fout: ${await res.text()}`);

  const json = await res.json();
  const byDomain: Record<string, DayData[]> = {};

  for (const row of json.rows ?? []) {
    const monthRaw: string = row.cells[0].value; // "2024-03" of "202403"
    const ym = monthRaw.replace("-", "");
    const date = `${ym}01`; // YYYYMM01 voor VisitorsTable
    const domain: string = row.cells[1].value;
    const earnings = parseFloat(row.cells[2].value ?? "0");
    const siteName = DOMAIN_MAP[domain];
    if (!siteName) continue;
    if (!byDomain[siteName]) byDomain[siteName] = [];
    byDomain[siteName].push({ date, value: earnings });
  }

  return ADSENSE_SITE_NAMES.map((name) => ({
    name,
    data: byDomain[name] ?? [],
  }));
}

export async function getAdsenseEarnings(days: number): Promise<SiteData[]> {
  const token = await getAdsenseToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1);

  const qs = [
    "dateRange=CUSTOM",
    `startDate.year=${start.getFullYear()}`,
    `startDate.month=${start.getMonth() + 1}`,
    `startDate.day=${start.getDate()}`,
    `endDate.year=${end.getFullYear()}`,
    `endDate.month=${end.getMonth() + 1}`,
    `endDate.day=${end.getDate()}`,
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
