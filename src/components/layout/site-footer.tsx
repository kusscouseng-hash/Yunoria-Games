import Link from "next/link";
import { siteConfig } from "@/config/site";
import { withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { Logo } from "./logo";

export async function SiteFooter() {
  const { locale, dict } = await getDictionary();
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-md text-sm text-subtle">{dict.footer.rightsNote}</p>
        </div>
        <nav aria-label={dict.a11y.legal}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {siteConfig.footerNav.map((item) => (
              <li key={item.href}>
                <Link href={withLocale(locale, item.href)} className="transition-colors hover:text-foreground">
                  {dict.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
