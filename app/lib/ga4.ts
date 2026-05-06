import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { OAuth2Client } from "google-auth-library";

export interface DayData {
  date: string;
  users: number;
}

export interface SiteData {
  name: string;
  data: DayData[];
}

const PROPERTIES = [
  { id: "301641883", name: "Verhaalsommen.nl" },
  { id: "400810268", name: "OefenBegrijpendLezen.nl" },
  { id: "530166190", name: "MijnTafeldiploma.nl" },
];

function getClient() {
  const auth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return new BetaAnalyticsDataClient({ authClient: auth as never });
}

export async function getVisitorsLast7Days(): Promise<SiteData[]> {
  const client = getClient();

  return Promise.all(
    PROPERTIES.map(async ({ id, name }) => {
      const [response] = await client.runReport({
        property: `properties/${id}`,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }],
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      });

      const data = (response.rows ?? []).map((row) => ({
        date: row.dimensionValues![0].value!,
        users: parseInt(row.metricValues![0].value ?? "0"),
      }));

      return { name, data };
    })
  );
}
