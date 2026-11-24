import { Suspense } from "react";
import Link from "next/link";
import { siteConfig, type NavItem } from "@/config/site";
import { withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { Logo } from "./logo";
import { AutoHideHeader } from "./auto-hide-header";
import { NavLinkList, NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";
import { LanguageSwitcher, LanguageSwitcherLinks } from "./language-switcher";
import { LoginButton, UserNav } from "./user-nav";

export async function SiteHeader() {
  const { locale, dict } = await getDictionary();
  const items: NavItem[] = siteConfig.nav.map((item) => ({
    href: withLocale(locale, item.href),
    label: dict.nav[item.key],
  }));

  return (
    <AutoHideHeader className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link href={withLocale(locale, "/")} aria-label={`${siteConfig.name} – ${dict.a11y.homeLink}`}>
            <Logo />
          </Link>
          <nav aria-label={dict.a11y.mainNav} className="hidden md:block">
            <Suspense fallback={<NavLinkList items={items} />}>
              <NavLinks items={items} />
            </Suspense>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden lg:block">
            {/* Schwester-Seite mit gemeinsamem Konto */}
            <a
              href={siteConfig.sisterSite.url}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2zM13 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5z" />
              </svg>
              {siteConfig.sisterSite.name}
            </a>
          </div>
          <div className="hidden md:block">
            <Suspense fallback={<LanguageSwitcherLinks current={locale} label={dict.a11y.language} />}>
              <LanguageSwitcher current={locale} label={dict.a11y.language} />
            </Suspense>
          </div>
          <Suspense fallback={<LoginButton locale={locale} loginLabel={dict.nav.login} />}>
            <UserNav locale={locale} loginLabel={dict.nav.login} accountLabel={dict.auth.userMenu} />
          </Suspense>
          <MobileMenu
            items={items}
            locale={locale}
            labels={{
              open: dict.a11y.openMenu,
              close: dict.a11y.closeMenu,
              nav: dict.a11y.mobileNav,
              language: dict.a11y.language,
            }}
          />
        </div>
      </div>
    </AutoHideHeader>
  );
}
