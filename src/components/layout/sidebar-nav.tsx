"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type SidebarItem = { href: string; label: string; icon: string; tint: string; external?: boolean };
export type SidebarGroup = { title?: string; items: SidebarItem[] };

/** Seitenleiste mit Symbolen; markiert die aktuelle Seite. */
export function SidebarNav({
  groups,
  homeHref,
  onNavigate,
  rail = false,
}: {
  groups: SidebarGroup[];
  homeHref: string;
  onNavigate?: () => void;
  rail?: boolean;
}) {
  const pathname = usePathname();
  return <SidebarList groups={groups} homeHref={homeHref} activePath={pathname} onNavigate={onNavigate} rail={rail} />;
}

export function SidebarList({
  groups,
  homeHref,
  activePath,
  onNavigate,
  rail = false,
}: {
  groups: SidebarGroup[];
  homeHref: string;
  activePath?: string;
  onNavigate?: () => void;
  /** schmale Leiste: Namen nur beim Drüberfahren/Ausklappen sichtbar */
  rail?: boolean;
}) {
  const label = rail ? "side-label" : "";
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g, gi) => (
        <div key={gi} className={cn(gi > 0 && "border-t border-border pt-4")}>
          {g.title && <p className={cn("mb-1.5 truncate px-3 text-[11px] font-bold uppercase tracking-wider text-subtle", label)}>{g.title}</p>}
          <ul className="flex flex-col gap-0.5">
            {g.items.map((item) => {
              const active =
                !item.external &&
                activePath !== undefined &&
                (item.href === homeHref ? activePath === item.href : activePath === item.href || activePath.startsWith(`${item.href}/`));
              const cls = cn(
                "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors",
                active ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground",
              );
              const inner = (
                <>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base"
                    style={{ background: active ? item.tint : `${item.tint}33` }}
                  >
                    {item.icon}
                  </span>
                  <span className={cn("truncate", label)}>{item.label}</span>
                </>
              );
              return (
                <li key={item.href} title={rail ? item.label : undefined}>
                  {item.external ? (
                    <a href={item.href} className={cls}>
                      {inner}
                    </a>
                  ) : (
                    <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cls}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
