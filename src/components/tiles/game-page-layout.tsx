import type { ReactNode } from "react";
import { GameArt } from "@/components/games/game-art";
import type { Tile } from "@/lib/catalog";
import { GameTile } from "./game-tile";
import { PlayerStage } from "./player-stage";

/** Empfehlungen: erst gleiche Kategorie, dann aufgefüllt mit beliebten Spielen. */
export function recommend(current: Tile, all: Tile[], n = 12): Tile[] {
  const others = all.filter((t) => t.key !== current.key);
  const same = others.filter((t) => t.category === current.category);
  const rest = others.filter((t) => t.category !== current.category);
  return [...same, ...rest].slice(0, n);
}

/**
 * Spielseite: Spielfeld groß in der Mitte, Titelleiste darunter,
 * Empfehlungen rechts (auf kleinen Bildschirmen darunter).
 */
export function GamePageLayout({
  tile,
  subtitle,
  player,
  recommended,
  recommendedTitle,
  originalLabel,
  stageLabels,
  children,
}: {
  tile: Tile;
  subtitle: string;
  player: ReactNode;
  recommended: Tile[];
  recommendedTitle: string;
  originalLabel: string;
  stageLabels: { zoomIn: string; zoomOut: string; fullscreen: string; exitFullscreen: string; zoom: string };
  children?: ReactNode;
}) {
  return (
    <div className="w-full px-3 py-4 sm:px-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <PlayerStage
            labels={stageLabels}
            header={
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {tile.kind === "own" ? (
                    <GameArt slug={tile.slug} color={tile.color} accent={tile.accent} className="h-full w-full" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- Vorschaubild direkt vom GamePix-CDN
                    <img src={tile.icon} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-black tracking-tight sm:text-xl">{tile.title}</h1>
                  <p className="truncate text-xs text-subtle">{subtitle}</p>
                </div>
              </div>
            }
          >
            {player}
          </PlayerStage>
        </div>
        <aside aria-label={recommendedTitle}>
          <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-subtle">{recommendedTitle}</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-2">
            {recommended.map((t) => (
              <GameTile key={t.key} tile={t} originalLabel={originalLabel} />
            ))}
          </div>
        </aside>
      </div>
      {children && <div className="mt-8 space-y-8">{children}</div>}
    </div>
  );
}
