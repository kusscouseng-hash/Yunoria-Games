import Link from "next/link";
import { withLocale, type Locale } from "@/i18n/config";
import type { ArcadeGame } from "@/lib/arcade/gamepix";

export function ArcadeCard({ game, locale, categoryLabel }: { game: ArcadeGame; locale: Locale; categoryLabel: string }) {
  return (
    <Link
      href={withLocale(locale, `/arcade/${game.namespace}`)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <div className="relative aspect-[8/5] overflow-hidden bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- Vorschaubild direkt vom GamePix-CDN */}
        <img
          src={game.banner}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-1 text-sm font-bold">{game.title}</span>
        <span className="mt-auto text-xs text-subtle">{categoryLabel}</span>
      </div>
    </Link>
  );
}
