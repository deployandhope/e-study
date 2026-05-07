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
