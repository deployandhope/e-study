"use client";

import { useState } from "react";
import VisitorsTable from "./VisitorsTable";
import type { SiteData } from "../lib/ga4";
import type { CategoryName } from "../lib/categories";

const OPTIONAL: CategoryName[] = ["Overig", "Onbekend"];

interface CategoryDataset {
  sites: SiteData[];
  categories: CategoryName[];
}

interface Props {
  views: CategoryDataset;
  revenue: CategoryDataset;
  viewsPathsByCategory: Record<string, string[]>;
  revenuePathsByCategory: Record<string, string[]>;
}

function filterDataset(ds: CategoryDataset, allow: Set<CategoryName>): CategoryDataset {
  const categories = ds.categories.filter((c) => !OPTIONAL.includes(c) || allow.has(c));
  const sites = ds.sites.filter((s) => categories.includes(s.name as CategoryName));
  return { sites, categories };
}

interface ToggleItem {
  label: CategoryName;
  active: boolean;
  toggle: () => void;
  available: boolean;
}

function ToggleDropdown({ items }: { items: ToggleItem[] }) {
  const [open, setOpen] = useState(false);
  const visible = items.filter((i) => i.available);
  if (visible.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="w-6 h-6 flex items-center justify-center rounded text-base font-bold leading-none transition-colors"
        style={{ color: "var(--muted)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#f0f4fa";
          (e.currentTarget as HTMLElement).style.color = "var(--text)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--muted)";
        }}
        aria-label="Categorieën tonen/verbergen"
      >
        +
      </button>
      {open && (
        <div
          className="absolute right-0 top-6 rounded shadow-xl min-w-[130px] py-1 z-50"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {visible.map((item) => (
            <button
              key={item.label}
              onClick={item.toggle}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#f0f4fa";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0 flex items-center justify-center"
                style={{
                  background: item.active ? "var(--primary)" : "transparent",
                  border: `1px solid ${item.active ? "var(--primary)" : "#d1d5db"}`,
                }}
              >
                {item.active && (
                  <svg
                    viewBox="0 0 8 8"
                    className="w-2 h-2"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 4l2 2 4-4" />
                  </svg>
                )}
              </span>
              <span style={{ color: "var(--text)" }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTables({
  views,
  revenue,
  viewsPathsByCategory,
  revenuePathsByCategory,
}: Props) {
  const [showOverig, setShowOverig] = useState(false);
  const [showOnbekend, setShowOnbekend] = useState(false);

  const allow = new Set<CategoryName>();
  if (showOverig) allow.add("Overig");
  if (showOnbekend) allow.add("Onbekend");

  const viewsFiltered = filterDataset(views, allow);
  const revenueFiltered = filterDataset(revenue, allow);

  const hasOverig = views.categories.includes("Overig") || revenue.categories.includes("Overig");
  const hasOnbekend =
    views.categories.includes("Onbekend") || revenue.categories.includes("Onbekend");

  const items: ToggleItem[] = [
    { label: "Overig", active: showOverig, toggle: () => setShowOverig((v) => !v), available: hasOverig },
    {
      label: "Onbekend",
      active: showOnbekend,
      toggle: () => setShowOnbekend((v) => !v),
      available: hasOnbekend,
    },
  ];

  const overlay = <ToggleDropdown items={items} />;

  return (
    <div className="flex flex-col gap-4">
      <VisitorsTable
        title="Views per categorie"
        subtitle="screenPageViews per maand"
        sites={viewsFiltered.sites}
        siteNames={viewsFiltered.categories}
        dateFormat="month"
        dateLabel="Maand"
        conditionalTotal
        showPercentageRow
        showRowPercentage
        headerRight={overlay}
        compact
        columnInfo={viewsPathsByCategory}
      />

      <VisitorsTable
        title="Revenue per categorie"
        subtitle="totalAdRevenue (EUR) per maand"
        sites={revenueFiltered.sites}
        siteNames={revenueFiltered.categories}
        format="currency"
        dateFormat="month"
        dateLabel="Maand"
        conditionalTotal
        showPercentageRow
        showRowPercentage
        headerRight={overlay}
        compact
        columnInfo={revenuePathsByCategory}
      />
    </div>
  );
}
