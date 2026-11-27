import { Suspense } from "react";
import type { Metadata } from "next";
import { Mosaic } from "@/components/tiles/tile-grids";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { allTiles, searchTiles } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.browse.searchTitle, robots: { index: false } };
}

export default async function SearchPage({ searchParams }: PageProps<"/[lang]/search">) {
  const { locale, dict } = await getDictionary();
  return (
    <div className="w-full px-4 py-5 sm:px-6">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
        <Results locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ locale, dict, searchParams }: { locale: Locale; dict: Dictionary; searchParams: PageProps<"/[lang]/search">["searchParams"] }) {
  const b = dict.browse;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const hits = searchTiles((await allTiles(locale)).all, q);
  return (
    <>
      <h1 className="mb-1 text-2xl font-black tracking-tight">{q ? b.resultsFor.replace("{q}", q) : b.searchTitle}</h1>
      <p className="mb-5 text-sm text-muted">{q.trim().length < 2 ? b.searchHint : b.gamesCount.replace("{n}", String(hits.length))}</p>
      {q.trim().length >= 2 && hits.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-muted">{b.noResults}</p>
      ) : (
        <Mosaic tiles={hits} originalLabel={b.original} bigEvery={0} />
      )}
    </>
  );
}
