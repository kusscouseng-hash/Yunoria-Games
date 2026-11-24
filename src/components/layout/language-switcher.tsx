"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, switchLocaleInPath, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

/** Merkt sich die gewählte Sprache für ein Jahr. */
function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

type Props = { current: Locale; label: string };

/** Umschalter EN | DE – bleibt auf derselben Seite, nur die Sprache wechselt. */
export function LanguageSwitcher(props: Props) {
  const pathname = usePathname();
  return <LanguageSwitcherLinks {...props} pathname={pathname} />;
}

/** Fallback während des Prerenderings: verlinkt auf die Startseite der jeweiligen Sprache. */
export function LanguageSwitcherLinks({ current, label, pathname }: Props & { pathname?: string }) {
  return (
    <div role="group" aria-label={label} className="flex items-center rounded-lg border border-border p-0.5">
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={pathname ? switchLocaleInPath(pathname, locale) : `/${locale}`}
            hrefLang={locale}
            onClick={() => rememberLocale(locale)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors",
              active ? "bg-surface-3 text-foreground" : "text-subtle hover:text-foreground",
            )}
          >
            {locale}
          </Link>
        );
      })}
    </div>
  );
}
