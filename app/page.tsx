export const dynamic = "force-dynamic";

import { getMetricLast7Days, PROPERTIES } from "./lib/ga4";
import VisitorsTable from "./components/VisitorsTable";

export default async function Page() {
  const [users, views, duration] = await Promise.all([
    getMetricLast7Days("activeUsers"),
    getMetricLast7Days("screenPageViewsPerUser"),
    getMetricLast7Days("averageSessionDuration"),
  ]);

  const siteNames = PROPERTIES.map((p) => p.name);
  const siteShorts = PROPERTIES.map((p) => p.short);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          Alle Domeinen
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Afgelopen 7 dagen
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
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
        <VisitorsTable
          title="Views per gebruiker"
          subtitle="screenPageViewsPerUser per dag"
          sites={views}
          siteNames={siteNames}
          siteShorts={siteShorts}
          format="decimal"
          aggregation="avg"
        />
      </div>
    </div>
  );
}
