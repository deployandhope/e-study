export const dynamic = "force-dynamic";

import { getVisitorsLast7Days, PROPERTIES } from "./lib/ga4";
import VisitorsTable from "./components/VisitorsTable";

export default async function Page() {
  const sites = await getVisitorsLast7Days();
  const siteNames = PROPERTIES.map((p) => p.name);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          Alle Domeinen
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Actieve gebruikers per dag — afgelopen 7 dagen
        </p>
      </div>
      <VisitorsTable sites={sites} siteNames={siteNames} />
    </div>
  );
}
