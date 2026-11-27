"use client";

import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import { LanguageSwitcher, LanguageSwitcherLinks } from "./language-switcher";
import { SidebarList, SidebarNav, type SidebarGroup } from "./sidebar-nav";

type Props = {
  groups: SidebarGroup[];
  homeHref: string;
  locale: Locale;
  labels: { open: string; close: string; nav: string; language: string };
};

/** Menü-Knopf links oben: schiebt auf Handys/Tablets die Seitenleiste herein. */
export function MobileMenu({ groups, homeHref, locale, labels }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? labels.close : labels.open}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open &&
        // Portal: die Kopfleiste hat einen Unschärfe-Filter, darin würden „fixed“-Elemente abgeschnitten
        createPortal(
          <>
            <button
              type="button"
              aria-label={labels.close}
              onClick={close}
              className="fixed inset-0 top-14 z-40 bg-black/60"
            />
            <div
              id="mobile-nav"
              className="fixed bottom-0 left-0 top-14 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-background px-3 py-4 shadow-2xl shadow-black/60"
            >
              <nav aria-label={labels.nav}>
                <Suspense
                  fallback={
                    <SidebarList
                      groups={groups}
                      homeHref={homeHref}
                      onNavigate={close}
                    />
                  }
                >
                  <SidebarNav
                    groups={groups}
                    homeHref={homeHref}
                    onNavigate={close}
                  />
                </Suspense>
              </nav>
              <div className="mt-4 flex items-center justify-between border-t border-border px-3 pt-4">
                <span className="text-sm text-muted">{labels.language}</span>
                <Suspense
                  fallback={
                    <LanguageSwitcherLinks
                      current={locale}
                      label={labels.language}
                    />
                  }
                >
                  <LanguageSwitcher current={locale} label={labels.language} />
                </Suspense>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
