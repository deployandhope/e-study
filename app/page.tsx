export const dynamic = "force-dynamic";

import { getVisitorsLast7Days } from "./lib/ga4";
import VisitorsChart from "./components/VisitorsChart";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

export default async function Page() {
  const sites = await getVisitorsLast7Days();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">eStudy Dashboard</h1>
          <p className="text-gray-500 mt-1">Bezoekers per dag — afgelopen 7 dagen</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </main>
  );
}
