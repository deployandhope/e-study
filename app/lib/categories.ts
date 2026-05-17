import { VERHAALSOMMEN_PUBLISHED_SLUGS, OBL_PUBLISHED_SLUGS } from "./published-slugs";

function slugOf(rawPath: string): string {
  return rawPath.split("?")[0].split("#")[0].replace(/^\/+|\/+$/g, "");
}

export function isPublishedVerhaalsommen(rawPath: string): boolean {
  const slug = slugOf(rawPath);
  if (slug === "") return true; // homepage
  return VERHAALSOMMEN_PUBLISHED_SLUGS.has(slug);
}

export function isPublishedObl(rawPath: string): boolean {
  const slug = slugOf(rawPath);
  if (slug === "") return true; // homepage
  return OBL_PUBLISHED_SLUGS.has(slug);
}

export type CategoryName =
  | "Homepage"
  | "Spelletjes"
  | "Werkbladen"
  | "Oefenpagina's"
  | "Takenpagina's"
  | "Groep Pagina's"
  | "Overig"
  | "Onbekend";

export const CATEGORY_ORDER: CategoryName[] = [
  "Homepage",
  "Spelletjes",
  "Werkbladen",
  "Oefenpagina's",
  "Takenpagina's",
  "Groep Pagina's",
  "Overig",
  "Onbekend",
];

const VS_OVERIG_SLUGS = new Set([
  "stappenplan-verhaaltjessommen",
  "klas",
  "leerkracht",
  "leerkracht-inloggen",
  "algemene-voorwaarden",
  "cookie-beleid",
  "privacy-beleid",
  "contact",
  "over-ons",
]);

export function categorizeVerhaalsommenPath(rawPath: string): CategoryName {
  const cleaned = rawPath.split("?")[0].split("#")[0];
  if (cleaned === "/" || cleaned === "") return "Homepage";

  const slug = cleaned.replace(/^\/+|\/+$/g, "");

  if (slug.startsWith("spelletje-")) return "Spelletjes";
  if (slug.startsWith("rekenspelletjes")) return "Spelletjes";
  if (slug === "rekenen-steen-papier-schaar") return "Spelletjes";

  if (slug.startsWith("werkbladen-")) return "Werkbladen";
  if (slug === "werkboekje-tafels") return "Werkbladen";

  if (slug.startsWith("verhaaltjessommen-groep-")) return "Groep Pagina's";

  if (slug === "taken") return "Takenpagina's";
  if (slug.startsWith("taken-groep-")) return "Takenpagina's";
  if (/^groep-\d+-.*-niveau-\d+$/.test(slug)) return "Oefenpagina's";

  if (VS_OVERIG_SLUGS.has(slug)) return "Overig";

  return "Onbekend";
}

const OBL_OVERIG_SLUGS = new Set([
  "klas",
  "leerkracht",
  "leerkracht-inloggen",
  "contact",
  "over-ons",
  "cookie-beleid",
  "privacy-beleid",
  "algemene-voorwaarden",
]);

const OBL_THEMA_RE = /^groep-\d+-(sinterklaas|lente|winter|herfst|zomer|pasen|kerst|halloween)$/;

export function categorizeOblPath(rawPath: string): CategoryName {
  const cleaned = rawPath.split("?")[0].split("#")[0];
  if (cleaned === "/" || cleaned === "") return "Homepage";

  const slug = cleaned.replace(/^\/+|\/+$/g, "");

  if (slug.startsWith("spelletje-")) return "Spelletjes";
  if (slug.startsWith("spelletjes-groep-")) return "Spelletjes";
  if (slug === "rekenspelletjes") return "Spelletjes";

  if (slug.endsWith("-werkbladen")) return "Werkbladen";

  if (slug === "taken") return "Takenpagina's";
  if (slug.startsWith("taken-groep-")) return "Takenpagina's";
  if (OBL_THEMA_RE.test(slug)) return "Oefenpagina's";

  if (/^groep-\d+$/.test(slug)) return "Oefenpagina's";

  if (OBL_OVERIG_SLUGS.has(slug)) return "Overig";

  return "Onbekend";
}

export function aggregateByCategory<T extends { path: string; value: number }>(
  rows: T[],
  categorize: (path: string) => CategoryName
): Record<CategoryName, number> {
  const result = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, 0])
  ) as Record<CategoryName, number>;
  for (const r of rows) {
    result[categorize(r.path)] += r.value;
  }
  return result;
}
