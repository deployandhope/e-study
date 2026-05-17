export const dynamic = "force-dynamic";

import { getMetricByMonthAndPath, SiteData } from "../lib/ga4";
import {
  categorizeVerhaalsommenPath,
  categorizeOblPath,
  isPublishedVerhaalsommen,
  isPublishedObl,
  CATEGORY_ORDER,
  CategoryName,
} from "../lib/categories";
import CategoryTables from "../components/CategoryTables";

const VERHAALSOMMEN_PROPERTY = "301641883";
const OBL_PROPERTY = "400810268";
const MONTHS = 12;

function buildSiteData(
  rows: { month: string; path: string; value: number }[],
  categorize: (path: string) => CategoryName
): { sites: SiteData[]; categories: CategoryName[]; pathsByCategory: Record<string, string[]> } {
  const monthCatTotals: Record<string, Record<string, number>> = {};
  const monthsSeen = new Set<string>();
  const catsWithData = new Set<CategoryName>();
  const pathsByCategory: Record<string, Set<string>> = {};

  for (const r of rows) {
    const cat = categorize(r.path);
    const monthKey = `${r.month}01`;
    monthsSeen.add(monthKey);
    if (!monthCatTotals[monthKey]) monthCatTotals[monthKey] = {};
    monthCatTotals[monthKey][cat] = (monthCatTotals[monthKey][cat] ?? 0) + r.value;
    if (r.value > 0) catsWithData.add(cat);
    if (!pathsByCategory[cat]) pathsByCategory[cat] = new Set();
    pathsByCategory[cat].add(r.path);
  }

  const categories = CATEGORY_ORDER.filter((c) => catsWithData.has(c));
  const months = Array.from(monthsSeen);

  const sites: SiteData[] = categories.map((cat) => ({
    name: cat,
    data: months.map((m) => ({
      date: m,
      value: monthCatTotals[m]?.[cat] ?? 0,
    })),
  }));

  const pathsByCategoryArr: Record<string, string[]> = {};
  for (const [cat, set] of Object.entries(pathsByCategory)) {
    pathsByCategoryArr[cat] = Array.from(set).sort();
  }

  return { sites, categories, pathsByCategory: pathsByCategoryArr };
}

async function fetchSiteData(
  propertyId: string,
  categorize: (path: string) => CategoryName,
  isPublished: (path: string) => boolean
) {
  const [viewsRaw, revenueRaw] = await Promise.all([
    getMetricByMonthAndPath(propertyId, "screenPageViews", MONTHS),
    getMetricByMonthAndPath(propertyId, "totalAdRevenue", MONTHS),
  ]);
  return {
    views: buildSiteData(viewsRaw.filter((r) => isPublished(r.path)), categorize),
    revenue: buildSiteData(revenueRaw.filter((r) => isPublished(r.path)), categorize),
  };
}

export default async function PageCategories() {
  const [vs, obl] = await Promise.all([
    fetchSiteData(VERHAALSOMMEN_PROPERTY, categorizeVerhaalsommenPath, isPublishedVerhaalsommen),
    fetchSiteData(OBL_PROPERTY, categorizeOblPath, isPublishedObl),
  ]);

  return (
    <div className="p-5 flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            oefenbegrijpendlezen.nl
          </h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Pagina&apos;s gegroepeerd per categorie · per maand · afgelopen {MONTHS} maanden
          </p>
        </div>
        <CategoryTables
          views={obl.views}
          revenue={obl.revenue}
          viewsPathsByCategory={obl.views.pathsByCategory}
          revenuePathsByCategory={obl.revenue.pathsByCategory}
        />
      </section>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            verhaalsommen.nl
          </h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Pagina&apos;s gegroepeerd per categorie · per maand · afgelopen {MONTHS} maanden
          </p>
        </div>
        <CategoryTables
          views={vs.views}
          revenue={vs.revenue}
          viewsPathsByCategory={vs.views.pathsByCategory}
          revenuePathsByCategory={vs.revenue.pathsByCategory}
        />
      </section>
    </div>
  );
}
