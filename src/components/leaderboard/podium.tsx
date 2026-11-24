import Link from "next/link";
import { cn } from "@/lib/cn";

export type PodiumEntry = {
  key: string;
  place: number;
  href: string;
  name: string;
  /** Bild (Avatar/Emblem) – fertig gerendert */
  picture: React.ReactNode;
  /** Abzeichen unter dem Namen (Rang, Gilden-Kürzel …) */
  badge?: React.ReactNode;
  score: string;
  scoreLabel: string;
  /** Kleine Zusatzzeile (z. B. Mitglieder, Level) */
  meta?: React.ReactNode;
  highlight?: boolean;
  /** Rundes Bild (Leser) statt eckig (Gilden) */
  round?: boolean;
};

const STYLE = {
  1: { ring: "from-amber-300 via-yellow-500 to-amber-700", glow: "shadow-[0_0_60px_-10px_rgb(251_191_36/0.55)]", num: "bg-amber-400 text-black", label: "text-amber-300" },
  2: { ring: "from-slate-200 via-slate-400 to-slate-600", glow: "shadow-[0_0_40px_-14px_rgb(203_213_225/0.45)]", num: "bg-slate-300 text-black", label: "text-slate-200" },
  3: { ring: "from-orange-300 via-orange-600 to-amber-900", glow: "shadow-[0_0_40px_-14px_rgb(234_88_12/0.5)]", num: "bg-orange-500 text-black", label: "text-orange-300" },
} as const;

/** Top 3 als Podest: Platz 2 links, Platz 1 in der Mitte (höher), Platz 3 rechts. */
export function Podium({ entries }: { entries: PodiumEntry[] }) {
  const byPlace = [entries[1], entries[0], entries[2]];
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {byPlace.map((e, i) => {
        if (!e) return <div key={i} />;
        const first = i === 1;
        const s = STYLE[(Math.min(3, Math.max(1, e.place)) as 1 | 2 | 3)];
        return (
          <Link
            key={e.key}
            href={e.href}
            className={cn(
              "group relative rounded-2xl bg-gradient-to-b p-[1.5px] transition-transform hover:-translate-y-1",
              s.ring,
              s.glow,
              first ? "sm:-mt-6" : "",
            )}
          >
            <div className={cn("relative flex h-full flex-col items-center rounded-[15px] bg-surface px-2 pb-4 text-center sm:px-4", first ? "pt-8 sm:pb-6 sm:pt-10" : "pt-7 sm:pb-5")}>
              <span className={cn("absolute -top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ring-4 ring-background", s.num)}>{e.place}</span>
              {first && (
                <span className="absolute -top-10 text-2xl drop-shadow-[0_2px_8px_rgb(251_191_36/0.6)] sm:-top-11 sm:text-3xl" aria-hidden="true">
                  👑
                </span>
              )}
              <div className={cn("bg-gradient-to-b p-[2px]", e.round ? "rounded-full" : "rounded-2xl", s.ring)}>{e.picture}</div>
              <p className="mt-3 line-clamp-1 max-w-full break-all text-sm font-bold group-hover:text-accent-hover sm:text-base">{e.name}</p>
              {e.badge && <div className="mt-1 flex flex-wrap justify-center gap-1">{e.badge}</div>}
              <p className={cn("mt-2 font-black tabular-nums", first ? "text-xl sm:text-2xl" : "text-base sm:text-lg", s.label)}>
                {e.score} <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 sm:text-xs">{e.scoreLabel}</span>
              </p>
              {e.meta && <div className="mt-1 text-[11px] text-subtle sm:text-xs">{e.meta}</div>}
              {e.highlight && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/** Einheitliche Listenzeile ab Platz 4. */
export function RankRow({
  place,
  href,
  picture,
  name,
  badge,
  sub,
  score,
  scoreLabel,
  meta,
  highlight,
}: {
  place: number;
  href: string;
  picture: React.ReactNode;
  name: React.ReactNode;
  badge?: React.ReactNode;
  sub?: React.ReactNode;
  score: string;
  scoreLabel: string;
  meta?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <li className={cn("flex items-center gap-3 border-b border-border/70 px-3 py-3 last:border-b-0 sm:gap-4 sm:px-5", highlight ? "bg-accent-soft" : "hover:bg-surface-2/60")}>
      <span className="w-7 shrink-0 text-center text-sm font-black tabular-nums text-subtle sm:w-9 sm:text-base">{place}</span>
      <Link href={href} className="shrink-0">
        {picture}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2 font-semibold">
          <Link href={href} className="truncate hover:text-accent-hover hover:underline">
            {name}
          </Link>
          {badge}
        </p>
        {sub && <div className="truncate text-xs">{sub}</div>}
      </div>
      {meta && <span className="hidden shrink-0 text-xs text-subtle sm:block">{meta}</span>}
      <span className="shrink-0 text-right">
        <span className="block font-black tabular-nums text-accent-hover">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-subtle">{scoreLabel}</span>
      </span>
    </li>
  );
}
