import Link from "next/link";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { GameInfo } from "@/lib/games/registry";
import { GameArt } from "./game-art";

export function GameCard({ game, locale, dict, best }: { game: GameInfo; locale: Locale; dict: Dictionary; best?: number }) {
  const t = dict.games;
  return (
    <Link
      href={withLocale(locale, `/play/${game.slug}`)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <div className="relative">
        <GameArt slug={game.slug} color={game.color} accent={game.accent} className="block aspect-[8/5] w-full transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute right-2.5 top-2.5 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-amber-200">{t.xpPerRound}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <span className="font-bold">{game.title[locale]}</span>
        <span className="text-xs text-muted">{game.tagline[locale]}</span>
        <span className="mt-auto pt-2 text-xs text-subtle">
          {t.categories[game.category]}
          {best != null && best > 0 && (
            <>
              {" · "}
              {t.best}: <span className="font-bold" style={{ color: game.accent }}>{best}</span>
            </>
          )}
        </span>
      </div>
    </Link>
  );
}
