"use client";

import { Suspense, useEffect, useState } from "react";
import type { NavItem } from "@/config/site";
import type { Locale } from "@/i18n/config";
import { NavLinkList, NavLinks } from "./nav-links";
import { LanguageSwitcher, LanguageSwitcherLinks } from "./language-switcher";

type Props = {
  items: NavItem[];
  locale: Locale;
  labels: { open: string; close: string; nav: string; language: string };
};

/** Ausklappbares Menü für Smartphones. */
export function MobileMenu({ items, locale, labels }: Props) {
  const [open, setOpen] = useState(false);

  // Mit Escape schließen
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? labels.close : labels.open}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div id="mobile-nav" className="animate-fade-up absolute inset-x-0 top-16 border-b border-border bg-background px-4 pb-6 pt-2 shadow-2xl shadow-black/60">
          <nav aria-label={labels.nav}>
            <Suspense fallback={<NavLinkList items={items} orientation="vertical" onNavigate={close} />}>
              <NavLinks items={items} orientation="vertical" onNavigate={close} />
            </Suspense>
          </nav>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted">{labels.language}</span>
            <Suspense fallback={<LanguageSwitcherLinks current={locale} label={labels.language} />}>
              <LanguageSwitcher current={locale} label={labels.language} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
