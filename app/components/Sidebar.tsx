"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Search, FolderTree } from "lucide-react";

const nav = [
  { href: "/", label: "Overview", icon: Globe },
  { href: "/search-data", label: "Search Data", icon: Search },
  { href: "/page-categories", label: "Page Categories", icon: FolderTree },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      <div
        className="px-5 py-5 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--sidebar-muted)", letterSpacing: "0.25em" }}
        >
          eStudy
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                color: active ? "var(--sidebar-text)" : "var(--sidebar-muted)",
                background: active ? "var(--sidebar-active)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
