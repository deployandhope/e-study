import { DailyCount } from "./stats";

const META_ACCOUNT = "act_623591061583998"; // E-Study - Main
const GRAPH = "https://graph.facebook.com/v21.0";

// Custom conversions op de gedeelde pixel "E-Study - Alle Websites" (sinds 09-10-2026).
// Die scheiden de sites zuiver: een klik op een RD-advertentie kan op OBL registreren.
const CUSTOM_CONVERSION_SITE: Record<string, string> = {
  "offsite_conversion.custom.2205177560035641": "RD",
  "offsite_conversion.custom.1128495249713539": "OBL",
};

// Campagnes zonder custom conversion (oudere, of op een eigen sitepixel) vallen
// terug op hun pixel-registraties, toegewezen op campagnenaam.
const CAMPAIGN_PREFIX_SITE: [string, string][] = [
  ["gg-nl-", "MTD"], // MTD-pixel 2209727106480191
  ["obl-", "OBL"],
  ["oefenbegrijpendlezen", "OBL"],
  ["rekendiploma", "RD"],
];

const PIXEL_REGISTRATION = "offsite_conversion.fb_pixel_complete_registration";

interface InsightRow {
  campaign_name: string;
  date_start: string;
  actions?: { action_type: string; value: string }[];
}

/** Facebook-registraties per site per dag (Meta-attributie, op conversiedatum). */
export async function getFacebookRegistrations(): Promise<Record<string, DailyCount[]>> {
  const token = process.env.META_ESTUDY_TOKEN;
  if (!token) throw new Error("META_ESTUDY_TOKEN ontbreekt");

  const params = new URLSearchParams({
    level: "campaign",
    date_preset: "maximum",
    time_increment: "1",
    action_report_time: "conversion",
    fields: "campaign_name,actions",
    limit: "500",
    access_token: token,
  });

  const rows: InsightRow[] = [];
  let url: string | undefined = `${GRAPH}/${META_ACCOUNT}/insights?${params}`;
  while (url) {
    const res: Response = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Meta insights fout: ${res.status} ${await res.text()}`);
    const json: { data?: InsightRow[]; paging?: { next?: string } } = await res.json();
    rows.push(...(json.data ?? []));
    url = json.paging?.next;
  }

  const bySite: Record<string, Record<string, number>> = {};
  const add = (site: string, date: string, n: number) => {
    if (!n) return;
    bySite[site] ??= {};
    bySite[site][date] = (bySite[site][date] ?? 0) + n;
  };

  for (const row of rows) {
    const actions = row.actions ?? [];
    const custom = actions.filter((a) => a.action_type in CUSTOM_CONVERSION_SITE);
    if (custom.length > 0) {
      for (const a of custom) add(CUSTOM_CONVERSION_SITE[a.action_type], row.date_start, parseInt(a.value, 10));
      continue;
    }
    const reg = actions.find((a) => a.action_type === PIXEL_REGISTRATION);
    const site = CAMPAIGN_PREFIX_SITE.find(([prefix]) => row.campaign_name.startsWith(prefix))?.[1];
    if (reg && site) add(site, row.date_start, parseInt(reg.value, 10));
  }

  return Object.fromEntries(
    Object.entries(bySite).map(([site, days]) => [
      site,
      Object.entries(days)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    ])
  );
}
