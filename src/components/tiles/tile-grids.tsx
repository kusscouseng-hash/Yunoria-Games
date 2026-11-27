import Link from "next/link";
import type { Tile } from "@/lib/catalog";
import { GameTile, WideTile } from "./game-tile";

/**
 * Dichtes Mosaik aus quadratischen Kacheln. Einzelne Kacheln sind doppelt so groß
 * (eigene Spiele immer, sonst jede 11. Kachel), die Lücken füllt das Raster selbst.
 */
export function Mosaic({ tiles, originalLabel, bigEvery = 11 }: { tiles: Tile[]; originalLabel: string; bigEvery?: number }) {
  return (
    <div className="grid grid-flow-dense grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(112px,1fr))] sm:gap-3">
      {tiles.map((t, i) => (
        <GameTile
          key={t.key}
          tile={t}
          originalLabel={originalLabel}
          big={t.kind === "own" || (bigEvery > 0 && i % bigEvery === 3)}
          priority={i < 12}
        />
      ))}
    </div>
  );
}

/** Waagerechte Reihe mit Überschrift und „Alle anzeigen“ */
export function TileRow({
  title,
  icon,
  href,
  showAll,
  tiles,
  originalLabel,
}: {
  title: string;
  icon?: string;
  href?: string;
  showAll: string;
  tiles: Tile[];
  originalLabel: string;
}) {
  if (tiles.length === 0) return null;
  return (
    <section>
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight sm:text-xl">
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </h2>
        {href && (
          <Link href={href} className="shrink-0 text-sm font-semibold text-accent-hover hover:underline">
            {showAll}
          </Link>
        )}
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:-mx-6 sm:px-6">
        {tiles.map((t) => (
          <WideTile key={t.key} tile={t} originalLabel={originalLabel} />
        ))}
      </div>
    </section>
  );
}
