import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArcadeCard } from "@/components/arcade/arcade-card";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { ARCADE_CATEGORIES, getArcadeCatalog, gamepixSid } from "@/lib/arcade/gamepix";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.arcade.title, description: dict.arcade.subtitle };
}

export default async function ArcadePage({ searchParams }: PageProps<"/[lang]/arcade">) {
  const { locale, dict } = await getDictionary();
  const t = dict.arcade;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-black tracking-tight">{t.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{t.subtitle}</p>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-2xl bg-surface" />}>
        <Catalog locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({
  locale,
  dict,
  searchParams,
}: {
  locale: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/arcade">["searchParams"];
}) {
  const t = dict.arcade;
  const sid = gamepixSid();
  if (!sid) return <p className="mt-8 rounded-2xl border border-border bg-surface p-6 text-muted">{t.notConfigured}</p>;

  const sp = await searchParams;
  const games = await getArcadeCatalog(sid);
  const present = new Set(games.map((g) => g.category));
  const cats = ARCADE_CATEGORIES.filter((c) => present.has(c));
  const active = typeof sp.c === "string" && cats.includes(sp.c as (typeof cats)[number]) ? sp.c : null;
  const shown = active ? games.filter((g) => g.category === active) : games;
  const base = withLocale(locale, "/arcade");
  const label = (c: string) => (t.categories as Record<string, string>)[c] ?? c;

  return (
    <>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label={t.title}>
        {[null, ...cats].map((c) => (
          <Link
            key={c ?? "all"}
            href={c ? `${base}?c=${c}` : base}
            scroll={false}
            aria-current={c === active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              c === active ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-foreground",
            )}
          >
            {c ? label(c) : t.all}
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <p className="mt-8 text-muted">{t.empty}</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((g) => (
            <ArcadeCard key={g.namespace} game={g} locale={locale} categoryLabel={label(g.category)} />
          ))}
        </div>
      )}
      <p className="mt-8 text-xs text-subtle">{t.provider}</p>
    </>
  );
}
