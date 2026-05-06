export const dynamic = "force-dynamic";

import { getVisitorsLast7Days } from "./lib/ga4";
import VisitorsChart from "./components/VisitorsChart";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

export default async function Page() {
  const sites = await getVisitorsLast7Days();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          Alle Domeinen
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Bezoekers per dag — afgelopen 7 dagen
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sites.map((site, i) => (
          <VisitorsChart
            key={site.name}
            name={site.name}
            data={site.data}
            color={COLORS[i]}
          />
        ))}
      </div>
    </div>
  );
}
