import { OAuth2Client } from "google-auth-library";

export interface DayData {
  date: string;
  value: number;
}

export interface SiteData {
  name: string;
  data: DayData[];
}

export const PROPERTIES = [
  { id: "400810268", name: "OefenBegrijpendLezen", short: "OBL" },
  { id: "301641883", name: "Verhaalsommen", short: "VS" },
  { id: "530166190", name: "MijnTafeldiploma", short: "MTD" },
  { id: "371057702", name: "MathWordProblems", short: "MWP" },
];

async function getAccessToken(): Promise<string> {
  const auth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("Kon geen access token ophalen");
  return token;
}

const MTD_PROPERTY = "530166190";

const MTD_SOURCES = [
  { name: "Totaal", short: "Totaal", filter: null },
  { name: "Google", short: "Google", filter: { fieldName: "sessionSource", stringFilter: { matchType: "EXACT", value: "google" } } },
  { name: "Facebook", short: "Facebook", filter: { fieldName: "sessionSource", stringFilter: { matchType: "CONTAINS", value: "facebook" } } },
  { name: "Direct", short: "Direct", filter: { fieldName: "sessionSource", stringFilter: { matchType: "EXACT", value: "(direct)" } } },
];

export const MTD_SOURCE_NAMES = MTD_SOURCES.map((s) => s.name);
export const MTD_SOURCE_SHORTS = MTD_SOURCES.map((s) => s.short);

export async function getMTDSourceBreakdown(days: number): Promise<SiteData[]> {
  const token = await getAccessToken();

  return Promise.all(
    MTD_SOURCES.map(async ({ name, filter }) => {
      const body: Record<string, unknown> = {
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }],
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      };

      if (filter) {
        body.dimensionFilter = { filter };
      }

      const res = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${MTD_PROPERTY}:runReport`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        }
      );

      if (!res.ok) throw new Error(`GA4 bron-fout ${name}: ${await res.text()}`);

      const json = await res.json();
      const data: DayData[] = (json.rows ?? []).map(
        (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
          date: row.dimensionValues[0].value,
          value: parseFloat(row.metricValues[0].value ?? "0"),
        })
      );

      return { name, data };
    })
  );
}

export interface ChannelMonthData {
  month: string;
  [channel: string]: number | string;
}

export async function getChannelBreakdownByMonth(
  propertyId: string,
  months: number
): Promise<{ data: ChannelMonthData[]; channels: string[] }> {
  const token = await getAccessToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dimensions: [{ name: "yearMonth" }, { name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "activeUsers" }],
        dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
        orderBys: [{ dimension: { dimensionName: "yearMonth" }, desc: false }],
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`GA4 channel-fout: ${await res.text()}`);

  const json = await res.json();
  const NL_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

  const monthsMap: Record<string, ChannelMonthData> = {};
  const channelTotals: Record<string, number> = {};

  for (const row of json.rows ?? []) {
    const ym: string = row.dimensionValues[0].value;
    const channel: string = row.dimensionValues[1].value;
    const value = parseFloat(row.metricValues[0].value ?? "0");

    const year = ym.slice(0, 4);
    const monthIdx = parseInt(ym.slice(4, 6), 10) - 1;
    const monthLabel = `${NL_MONTHS[monthIdx]} '${year.slice(2)}`;

    if (!monthsMap[ym]) monthsMap[ym] = { month: monthLabel };
    monthsMap[ym][channel] = value;
    channelTotals[channel] = (channelTotals[channel] ?? 0) + value;
  }

  const channels = Object.keys(channelTotals).sort(
    (a, b) => channelTotals[b] - channelTotals[a]
  );

  const data = Object.entries(monthsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  return { data, channels };
}

export interface DailyMultiSiteRow {
  date: string;
  [siteShort: string]: number | string;
}

export async function getCombinedDailyMetric(
  metric: string,
  days: number
): Promise<DailyMultiSiteRow[]> {
  const token = await getAccessToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const perSite = await Promise.all(
    PROPERTIES.map(async ({ id, short, name }) => {
      const res = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            dimensions: [{ name: "date" }],
            metrics: [{ name: metric }],
            dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
            orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
          }),
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error(`GA4 daily-fout (${name}): ${await res.text()}`);
      const json = await res.json();
      const rows = (json.rows ?? []).map(
        (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
          date: row.dimensionValues[0].value, // YYYYMMDD
          value: parseFloat(row.metricValues[0].value ?? "0"),
        })
      );
      return { short, data: rows };
    })
  );

  const dateMap: Record<string, DailyMultiSiteRow> = {};
  for (const { short, data } of perSite) {
    for (const d of data) {
      const iso = `${d.date.slice(0, 4)}-${d.date.slice(4, 6)}-${d.date.slice(6, 8)}`;
      if (!dateMap[iso]) dateMap[iso] = { date: iso };
      dateMap[iso][short] = d.value;
    }
  }

  return Object.values(dateMap).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );
}

export async function getMetricByMonthAndPath(
  propertyId: string,
  metric: string,
  months: number
): Promise<{ month: string; path: string; value: number }[]> {
  const token = await getAccessToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dimensions: [{ name: "yearMonth" }, { name: "pagePath" }],
        metrics: [{ name: metric }],
        dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
        limit: "200000",
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`GA4 month-paths fout (${metric}): ${await res.text()}`);

  const json = await res.json();
  return (json.rows ?? []).map(
    (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      month: row.dimensionValues[0].value, // "202601"
      path: row.dimensionValues[1].value,
      value: parseFloat(row.metricValues[0].value ?? "0"),
    })
  );
}

export async function getPageViewsByPath(
  propertyId: string,
  days: number
): Promise<{ path: string; value: number }[]> {
  const token = await getAccessToken();

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
        limit: "100000",
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`GA4 paths-fout: ${await res.text()}`);

  const json = await res.json();
  return (json.rows ?? []).map(
    (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      path: row.dimensionValues[0].value,
      value: parseFloat(row.metricValues[0].value ?? "0"),
    })
  );
}

export async function getMetricLast7Days(metric: string): Promise<SiteData[]> {
  const token = await getAccessToken();

  return Promise.all(
    PROPERTIES.map(async ({ id, name }) => {
      const res = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dimensions: [{ name: "date" }],
            metrics: [{ name: metric }],
            dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
          }),
          cache: "no-store",
        }
      );

      if (!res.ok) throw new Error(`GA4 fout voor ${name}: ${await res.text()}`);

      const json = await res.json();
      const data: DayData[] = (json.rows ?? []).map(
        (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
          date: row.dimensionValues[0].value,
          value: parseFloat(row.metricValues[0].value ?? "0"),
        })
      );

      return { name, data };
    })
  );
}
