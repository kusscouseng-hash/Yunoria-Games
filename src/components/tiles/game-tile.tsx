import Link from "next/link";
import { GameArt } from "@/components/games/game-art";
import { cn } from "@/lib/cn";
import type { Tile } from "@/lib/catalog";

/**
 * Quadratische Spielkachel (Mosaik). Name erscheint beim Drüberfahren,
 * eigene Spiele tragen ein „Original“-Abzeichen.
 */
export function GameTile({
  tile,
  big = false,
  originalLabel,
  priority = false,
}: {
  tile: Tile;
  big?: boolean;
  originalLabel: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={tile.href}
      title={tile.title}
      className={cn(
        "group relative block aspect-square overflow-hidden rounded-2xl bg-surface-2 shadow-[0_4px_14px_rgb(0_0_0/0.35)] outline-none ring-accent transition-transform duration-200 hover:z-10 hover:scale-[1.04] focus-visible:ring-4",
        big && "col-span-2 row-span-2",
      )}
    >
      {tile.kind === "own" ? (
        <GameArt slug={tile.slug} color={tile.color} accent={tile.accent} className="h-full w-full" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- Vorschaubild direkt vom GamePix-CDN
        <img
          src={tile.icon}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
      {tile.kind === "own" && (
        <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow">
          {originalLabel}
        </span>
      )}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2.5 pb-2 pt-8 font-bold leading-tight text-white transition-opacity duration-200",
          big ? "text-lg opacity-100" : "text-xs opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
      >
        {tile.title}
      </span>
    </Link>
  );
}

/** Breitere Kachel mit Titelbild für die waagerechten Reihen */
export function WideTile({ tile, originalLabel }: { tile: Tile; originalLabel: string }) {
  return (
    <Link
      href={tile.href}
      className="group relative block w-40 shrink-0 snap-start overflow-hidden rounded-xl bg-surface-2 outline-none ring-accent transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-4 sm:w-52"
    >
      <div className="relative aspect-[8/5] overflow-hidden">
        {tile.kind === "own" ? (
          <GameArt slug={tile.slug} color={tile.color} accent={tile.accent} className="h-full w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Vorschaubild direkt vom GamePix-CDN
          <img src={tile.cover} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        )}
        {tile.kind === "own" && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow">
            {originalLabel}
          </span>
        )}
      </div>
      <p className="truncate px-2.5 py-2 text-sm font-semibold">{tile.title}</p>
    </Link>
  );
}
