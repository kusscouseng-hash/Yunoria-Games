import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mosaic } from "@/components/tiles/tile-grids";
import { getDictionary } from "@/i18n/get-dictionary";
import { CATEGORY_ICON, CATEGORY_TINT, COLLECTIONS, SITE_CATEGORIES, allTiles, forListing, isCollection, isSiteCategory } from "@/lib/catalog";

export function generateStaticParams() {
  return [...COLLECTIONS, ...SITE_CATEGORIES].map((slug) => ({ slug }));
}

function labelFor(slug: string, b: Awaited<ReturnType<typeof getDictionary>>["dict"]["browse"]) {
  if (isCollection(slug)) return b.collections[slug];
  if (isSiteCategory(slug)) return b.categories[slug];
  return null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { dict } = await getDictionary();
  const label = labelFor(slug, dict.browse);
  return label ? { title: label } : {};
}

export default async function ListingPage({ params }: PageProps<"/[lang]/c/[slug]">) {
  const { slug } = await params;
  if (!isCollection(slug) && !isSiteCategory(slug)) notFound();
  const { locale, dict } = await getDictionary();
  const b = dict.browse;
  const tiles = forListing(slug, await allTiles(locale));
  return (
    <div className="w-full px-4 py-5 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: CATEGORY_TINT[slug] }}>
          {CATEGORY_ICON[slug]}
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{labelFor(slug, b)}</h1>
          <p className="text-sm text-muted">{b.gamesCount.replace("{n}", String(tiles.length))}</p>
        </div>
      </div>
      {tiles.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-muted">{dict.arcade.empty}</p>
      ) : (
        <Mosaic tiles={tiles} originalLabel={b.original} bigEvery={slug === "originals" ? 0 : 13} />
      )}
    </div>
  );
}
