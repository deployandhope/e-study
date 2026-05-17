export const dynamic = "force-dynamic";

import { getMetricLast7Days, getCombinedDailyMetric, PROPERTIES } from "./lib/ga4";
import { getAdsenseEarnings, getAdsenseMonthlyEarnings, getAdsenseDailyByDomain, getAdsenseMonthlyByDomain, ADSENSE_SITE_NAMES, ADSENSE_SITE_SHORTS } from "./lib/adsense";
import VisitorsTable from "./components/VisitorsTable";
import EarningsChart from "./components/EarningsChart";
import ClicksLineChart from "./components/ClicksLineChart";

export default async function Page() {
  const now = new Date();
  const monthlyMonthsSinceMar2022 =
    (now.getFullYear() - 2022) * 12 + (now.getMonth() - 2) + 1;

  const [users, views, duration, totalUsers, adsenseEarnings, adsenseMonthly, dailyUsers, dailyEarnings, monthlyByDomain] = await Promise.all([
    getMetricLast7Days("activeUsers"),
    getMetricLast7Days("screenPageViewsPerUser"),
    getMetricLast7Days("averageSessionDuration"),
    getMetricLast7Days("totalUsers"),
    getAdsenseEarnings(30),
    getAdsenseMonthlyEarnings(monthlyMonthsSinceMar2022),
    getCombinedDailyMetric("totalUsers", 183),
    getAdsenseDailyByDomain(183),
    getAdsenseMonthlyByDomain(monthlyMonthsSinceMar2022),
  ]);

  const ADSENSE_SITES = [
    { short: "OBL", name: "OefenBegrijpendLezen", color: "#2563eb" },
    { short: "VS", name: "Verhaalsommen", color: "#14b8a6" },
    { short: "MWP", name: "MathWordProblems", color: "#ec4899" },
  ];

  const siteNames = PROPERTIES.map((p) => p.name);
  const siteShorts = PROPERTIES.map((p) => p.short);

  return (
    <div className="p-5">
      <div className="grid grid-cols-2 gap-4">
        <VisitorsTable
          title="AdSense — geschatte inkomsten"
          subtitle="estimatedEarnings per dag (EUR) · afgelopen 30 dagen"
          sites={adsenseEarnings}
          siteNames={ADSENSE_SITE_NAMES}
          siteShorts={ADSENSE_SITE_SHORTS}
          format="currency"
          maxHeight={270}
          conditionalTotal
        />
        <EarningsChart data={adsenseMonthly} />
      </div>
      <div className="mt-4">
        <ClicksLineChart
          title="AdSense — inkomsten per dag per website"
          subtitle="estimatedEarnings per dag (EUR) · afgelopen 6 maanden"
          data={dailyEarnings}
          xInterval={13}
          sites={ADSENSE_SITES}
          format="currency"
        />
      </div>
      <div className="mt-4">
        <ClicksLineChart
          title="GA4 — totalUsers per dag"
          subtitle="totalUsers per dag · afgelopen 6 maanden"
          data={dailyUsers}
          xInterval={13}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <VisitorsTable
            title="Actieve gebruikers"
            subtitle="activeUsers per dag"
            sites={users}
            siteNames={siteNames}
            siteShorts={siteShorts}
          />
          <VisitorsTable
            title="Gemiddelde sessieduur"
            subtitle="averageSessionDuration per dag"
            sites={duration}
            siteNames={siteNames}
            siteShorts={siteShorts}
            format="duration"
            aggregation="avg"
          />
        </div>
        <div className="flex flex-col gap-4">
          <VisitorsTable
            title="Views per gebruiker"
            subtitle="screenPageViewsPerUser per dag"
            sites={views}
            siteNames={siteNames}
            siteShorts={siteShorts}
            format="decimal"
            aggregation="avg"
          />
          <VisitorsTable
            title="Totale gebruikers"
            subtitle="totalUsers per dag"
            sites={totalUsers}
            siteNames={siteNames}
            siteShorts={siteShorts}
          />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {monthlyByDomain
          .filter((s) => s.data.length > 0)
          .map((site) => {
            const NL = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
            const data = site.data.map((d) => {
              const y = d.date.slice(0, 4);
              const m = parseInt(d.date.slice(4, 6), 10) - 1;
              return {
                month: `${NL[m]} '${y.slice(2)}`,
                earnings: d.value,
              };
            });
            return (
              <EarningsChart
                key={site.name}
                title={`${site.name} — maandelijkse inkomsten`}
                subtitle="estimatedEarnings per maand (EUR)"
                data={data}
              />
            );
          })}
      </div>
    </div>
  );
}
