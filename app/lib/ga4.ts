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

export async function getVisitorsLast7Days(): Promise<SiteData[]> {
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
            metrics: [{ name: "activeUsers" }],
            dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
          }),
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`GA4 fout voor ${name}: ${err}`);
      }

      const json = await res.json();
      const data: DayData[] = (json.rows ?? []).map(
        (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
          date: row.dimensionValues[0].value,
          users: parseInt(row.metricValues[0].value ?? "0"),
        })
      );

      return { name, data };
    })
  );
}
