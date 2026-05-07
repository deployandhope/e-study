export const dynamic = "force-dynamic";

import { getMetricLast7Days, getMTDSourceBreakdown, PROPERTIES, MTD_SOURCE_NAMES, MTD_SOURCE_SHORTS } from "./lib/ga4";
import VisitorsTable from "./components/VisitorsTable";

export default async function Page() {
  const [users, views, duration, totalUsers, mtdSources] = await Promise.all([
    getMetricLast7Days("activeUsers"),
    getMetricLast7Days("screenPageViewsPerUser"),
    getMetricLast7Days("averageSessionDuration"),
    getMetricLast7Days("totalUsers"),
    getMTDSourceBreakdown(30),
  ]);

  const siteNames = PROPERTIES.map((p) => p.name);
  const siteShorts = PROPERTIES.map((p) => p.short);

  return (
    <div className="p-5">
      <div className="grid grid-cols-2 gap-4">
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
      <div className="mt-4">
        <VisitorsTable
          title="MijnTafeldiploma — bezoekers per bron"
          subtitle="activeUsers afgelopen 30 dagen"
          sites={mtdSources}
          siteNames={MTD_SOURCE_NAMES}
          siteShorts={MTD_SOURCE_SHORTS}
          maxHeight={420}
          showTotal={false}
        />
      </div>
    </div>
  );
}
