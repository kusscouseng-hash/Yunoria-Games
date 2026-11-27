import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { withLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAdmin } from "@/lib/auth/admin";
import { togglePick } from "@/lib/arcade/picks-actions";
import { activeSources, getPicks, providerCatalog, providerInfo } from "@/lib/arcade/sources";
import { type ArcadeGame, type ArcadeSource } from "@/lib/arcade/types";
import { CATEGORY_ICON, SITE_CATEGORIES, isSiteCategory } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { robots: { index: false } };

const PER_PAGE = 60;

/**
 * Admin-Bereich: Partner-Spiele durchsehen, testen und in die handverlesene Auswahl
 * aufnehmen. Die öffentliche Seite zeigt nur ausgewählte Spiele (sobald es mindestens eins gibt).
 */
export default async function AdminArcadePage({ searchParams }: PageProps<"/[lang]/admin/arcade">) {
  const { locale } = await getDictionary();
  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface" />}>
        <AdminBody locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function AdminBody({ locale, searchParams }: { locale: Locale; searchParams: PageProps<"/[lang]/admin/arcade">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const sources = activeSources();
  const view = one(sp.view);
  const tab: ArcadeSource | "picked" = view === "gpx" || view === "gd" ? view : view === "picked" ? "picked" : (sources[0] ?? "picked");
  const q = one(sp.q).trim().slice(0, 60);
  const cat = isSiteCategory(one(sp.cat)) ? one(sp.cat) : "";
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);

  const picks = (await getPicks()) ?? null;
  const pickedIds = new Set((picks ?? []).map((g) => g.id));
  let games: ArcadeGame[] = tab === "picked" ? (picks ?? []) : await providerCatalog(tab);
  if (cat) games = games.filter((g) => g.category === cat);
  if (q.length >= 2) {
    const needle = q.toLowerCase();
    games = games.filter((g) => g.title.toLowerCase().includes(needle));
  }
  const pages = Math.max(1, Math.ceil(games.length / PER_PAGE));
  const shown = games.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const base = withLocale(locale, "/admin/arcade");
  const link = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    const merged = { view: tab, q, cat, page: 1, ...over };
    for (const [k, v] of Object.entries(merged)) if (v !== "" && !(k === "page" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  const tabs: { key: ArcadeSource | "picked"; label: string }[] = [
    { key: "picked", label: `Meine Auswahl (${picks?.length ?? 0})` },
    ...sources.map((s) => ({ key: s, label: providerInfo(s).name })),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Spiele auswählen</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Such dir die besten Spiele aus. Auf der Seite erscheinen nur Spiele aus „Meine Auswahl“ (plus eure eigenen Spiele).
          Solange die Auswahl leer ist, werden wie bisher die GamePix-Spiele gezeigt. Mit „Testen“ öffnest du ein Spiel in einem neuen Tab.
        </p>
        {picks === null && (
          <p className="mt-3 rounded-xl border border-border bg-surface-2 p-3 text-sm font-semibold">
            Die Tabelle für die Auswahl fehlt noch: Führe die Migration <code>20261127220000_arcade_picks.sql</code> im Supabase-SQL-Editor aus.
          </p>
        )}
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Quelle">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={link({ view: t.key, cat: "", q: "" })}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-colors",
              tab === t.key ? "bg-accent text-accent-foreground" : "bg-surface-2 text-muted hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <form action={base} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="view" value={tab} />
        <label className="flex flex-col gap-1 text-xs font-bold text-subtle">
          Suchen
          <input
            name="q"
            defaultValue={q}
            placeholder="Spielname …"
            className="h-10 w-56 rounded-lg border border-border bg-surface px-3 text-sm font-normal text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-subtle">
          Kategorie
          <select name="cat" defaultValue={cat} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm font-normal text-foreground">
            <option value="">Alle</option>
            {SITE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_ICON[c]} {c}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-10 rounded-lg bg-surface-2 px-4 text-sm font-bold hover:bg-surface-3">
          Filtern
        </button>
        <span className="ml-auto text-sm text-muted">{games.length} Spiele</span>
      </form>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
          {tab === "picked" ? "Noch keine Spiele ausgewählt. Wechsle oben zu einem Anbieter und klicke bei guten Spielen auf „Aufnehmen“." : "Keine Spiele gefunden."}
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {shown.map((g) => {
            const picked = pickedIds.has(g.id);
            return (
              <li key={g.id} className={cn("flex flex-col overflow-hidden rounded-2xl border bg-surface", picked ? "border-accent" : "border-border")}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Vorschaubild direkt vom Anbieter-CDN */}
                <img src={g.banner} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 text-sm font-bold">{g.title}</p>
                  <p className="text-xs text-subtle">
                    {CATEGORY_ICON[g.category]} {g.category} · {providerInfo(g.source).name}
                  </p>
                  <div className="mt-auto flex gap-2">
                    <a
                      href={withLocale(locale, `/arcade/${g.id}`)}
                      target="_blank"
                      rel="noopener"
                      className="flex h-9 flex-1 items-center justify-center rounded-lg bg-surface-2 text-sm font-semibold hover:bg-surface-3"
                    >
                      Testen
                    </a>
                    {picks !== null && (
                      <form action={togglePick} className="flex-1">
                        <input type="hidden" name="source" value={g.source} />
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="mode" value={picked ? "remove" : "add"} />
                        <button
                          type="submit"
                          className={cn(
                            "h-9 w-full rounded-lg text-sm font-bold",
                            picked ? "border border-border-strong text-muted hover:text-foreground" : "bg-accent text-accent-foreground hover:bg-accent-hover",
                          )}
                        >
                          {picked ? "Entfernen" : "Aufnehmen"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm font-semibold" aria-label="Seiten">
          {page > 1 && (
            <Link href={link({ page: page - 1 })} className="rounded-lg bg-surface-2 px-3 py-2 hover:bg-surface-3">
              ← Zurück
            </Link>
          )}
          <span className="text-muted">
            Seite {page} von {pages}
          </span>
          {page < pages && (
            <Link href={link({ page: page + 1 })} className="rounded-lg bg-surface-2 px-3 py-2 hover:bg-surface-3">
              Weiter →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
