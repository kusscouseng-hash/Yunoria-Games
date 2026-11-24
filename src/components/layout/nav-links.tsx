"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/config/site";
import { cn } from "@/lib/cn";

type NavLinksProps = {
  items: NavItem[];
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
};

/** Navigation mit Hervorhebung der aktuellen Seite. */
export function NavLinks(props: NavLinksProps) {
  const pathname = usePathname();
  return <NavLinkList {...props} activePath={pathname} />;
}

/** Statische Variante ohne aktive Markierung – Fallback während des Prerenderings. */
export function NavLinkList({
  items,
  orientation = "horizontal",
  activePath,
  onNavigate,
}: NavLinksProps & { activePath?: string }) {
  // Die Startseite ist das kürzeste Ziel (z. B. "/en") – nur bei exakter Übereinstimmung aktiv
  const homeHref = items[0]?.href;
  return (
    <ul className={cn("flex", orientation === "horizontal" ? "items-center gap-1" : "flex-col gap-1")}>
      {items.map((item) => {
        const active =
          activePath !== undefined &&
          (item.href === homeHref
            ? activePath === item.href
            : activePath === item.href || activePath.startsWith(`${item.href}/`));
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:bg-surface-2 hover:text-foreground",
              )}
            >
              {item.label}
              {active && orientation === "horizontal" && (
                <span className="mx-auto mt-1 block h-0.5 w-4 rounded-full bg-accent" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
