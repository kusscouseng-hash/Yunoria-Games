import { Suspense } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { LanguageSwitcher, LanguageSwitcherLinks } from "./language-switcher";
import { sidebarGroups } from "./sidebar";
import { LoginButton, UserNav } from "./user-nav";

/** Obere Leiste: Menü + Logo links, große Suche in der Mitte, Konto rechts. */
export async function SiteHeader() {
  const { locale, dict } = await getDictionary();
  const c = dict.browse;
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-full items-center gap-2 px-2 sm:gap-3 sm:px-4">
        <MobileMenu
          groups={sidebarGroups(locale, dict)}
          homeHref={withLocale(locale, "/")}
          locale={locale}
          labels={{ open: dict.a11y.openMenu, close: dict.a11y.closeMenu, nav: dict.a11y.mobileNav, language: dict.a11y.language }}
        />
        <Link href={withLocale(locale, "/")} aria-label={`${siteConfig.name} – ${dict.a11y.homeLink}`} className="shrink-0 lg:w-56">
          <Logo compact />
        </Link>

        <form action={withLocale(locale, "/search")} role="search" className="mx-auto flex min-w-0 max-w-xl flex-1">
          <label className="relative flex w-full items-center">
            <span className="sr-only">{c.searchPlaceholder}</span>
            <svg className="pointer-events-none absolute left-3.5 text-subtle" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              name="q"
              required
              minLength={2}
              maxLength={60}
              placeholder={c.searchPlaceholder}
              className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-subtle focus:border-accent"
            />
          </label>
        </form>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden md:block">
            <Suspense fallback={<LanguageSwitcherLinks current={locale} label={dict.a11y.language} />}>
              <LanguageSwitcher current={locale} label={dict.a11y.language} />
            </Suspense>
          </div>
          <Suspense fallback={<LoginButton locale={locale} loginLabel={dict.nav.login} />}>
            <UserNav locale={locale} loginLabel={dict.nav.login} accountLabel={dict.auth.userMenu} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
