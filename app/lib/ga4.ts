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
  { id: "400810268", name: "OefenBegrijpendLezen" },
  { id: "301641883", name: "Verhaalsommen" },
  { id: "530166190", name: "MijnTafeldiploma" },
  { id: "371057702", name: "MathWordProblems" },
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
