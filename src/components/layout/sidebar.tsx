import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { CATEGORY_ICON, CATEGORY_TINT, COLLECTIONS, SITE_CATEGORIES } from "@/lib/catalog";
import { SidebarList, SidebarNav, type SidebarGroup } from "./sidebar-nav";

export function sidebarGroups(locale: Locale, dict: Dictionary): SidebarGroup[] {
  const c = dict.browse;
  return [
    {
      items: [
        { href: withLocale(locale, "/"), label: dict.nav.home, icon: "🏠", tint: "#7b5cff" },
        ...COLLECTIONS.map((k) => ({ href: withLocale(locale, `/c/${k}`), label: c.collections[k], icon: CATEGORY_ICON[k], tint: CATEGORY_TINT[k] })),
      ],
    },
    {
      items: [
        { href: withLocale(locale, "/leaderboard"), label: dict.nav.leaderboard, icon: "🏆", tint: "#fbbf24" },
        { href: withLocale(locale, "/guilds"), label: dict.nav.guilds, icon: "🛡️", tint: "#60a5fa" },
      ],
    },
    {
      title: c.categoriesTitle,
      items: SITE_CATEGORIES.map((k) => ({ href: withLocale(locale, `/c/${k}`), label: c.categories[k], icon: CATEGORY_ICON[k], tint: CATEGORY_TINT[k] })),
    },
    {
      items: [{ href: siteConfig.sisterSite.url, label: siteConfig.sisterSite.name, icon: "📖", tint: "#f87171", external: true }],
    },
  ];
}

/** Feste Seitenleiste ab Laptop-Breite (auf Handys steckt sie im Menü oben links). */
export async function Sidebar() {
  const { locale, dict } = await getDictionary();
  const groups = sidebarGroups(locale, dict);
  const home = withLocale(locale, "/");
  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border bg-background/60 px-3 py-4 [scrollbar-width:thin] lg:block">
      <nav aria-label={dict.a11y.mainNav}>
        <Suspense fallback={<SidebarList groups={groups} homeHref={home} />}>
          <SidebarNav groups={groups} homeHref={home} />
        </Suspense>
      </nav>
    </aside>
  );
}
