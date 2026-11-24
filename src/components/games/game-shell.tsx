"use client";

import Link from "next/link";
import { useCallback, useRef, useState, useTransition } from "react";
import { submitScore, type SubmitResult } from "@/lib/games/actions";
import type { GameSlug } from "@/lib/games/registry";
import { BlocksGame } from "./blocks-game";
import { MemoryGame } from "./memory-game";
import { MergeGame } from "./merge-game";
import { SnakeGame } from "./snake-game";
import { StarsGame } from "./stars-game";
import type { GameProps } from "./use-board-size";

const GAMES: Record<GameSlug, (p: GameProps) => React.ReactNode> = {
  stars: StarsGame,
  merge: MergeGame,
  snake: SnakeGame,
  blocks: BlocksGame,
  memory: MemoryGame,
};

export type ShellLabels = {
  play: string;
  again: string;
  score: string;
  best: string;
  gameOver: string;
  xpGained: string; // "+{xp} XP"
  newBest: string;
  todayXp: string; // "{today}/{cap} XP heute"
  capReached: string;
  signInToSave: string;
  signIn: string;
  tooFast: string;
  implausible: string;
  error: string;
  saving: string;
};

/** Rahmen um jedes Spiel: Start, laufende Punkte, Ergebnis + XP. */
export function GameShell({
  slug,
  color,
  accent,
  howTo,
  best,
  signedIn,
  loginHref,
  t,
}: {
  slug: GameSlug;
  color: string;
  accent: string;
  howTo: string;
  best: number;
  signedIn: boolean;
  loginHref: string;
  t: ShellLabels;
}) {
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [bestScore, setBestScore] = useState(best);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const Game = GAMES[slug];

  const start = () => {
    setScore(0);
    setResult(null);
    setRound((r) => r + 1);
    startedAt.current = performance.now();
    setPhase("playing");
  };

  const onScore = useCallback((s: number) => setScore(s), []);
  const onGameOver = useCallback(
    (final: number) => {
      const duration = performance.now() - startedAt.current;
      setScore(final);
      setPhase("over");
      setBestScore((b) => Math.max(b, final));
      if (!signedIn) return;
      startTransition(async () => {
        const r = await submitScore(slug, final, duration);
        setResult(r);
        if (r.ok) setBestScore((b) => Math.max(b, r.best));
      });
    },
    [signedIn, slug],
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-border" style={{ background: color }}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
        <span className="text-sm font-semibold text-white/70">
          {t.score}: <span className="text-lg font-extrabold tabular-nums text-white">{score}</span>
        </span>
        <span className="text-sm font-semibold text-white/70">
          {t.best}: <span className="font-extrabold tabular-nums" style={{ color: accent }}>{bestScore}</span>
        </span>
      </div>

      <div className="relative p-3 sm:p-5">
        {phase === "playing" || phase === "over" ? (
          <div key={round} className={phase === "over" ? "pointer-events-none opacity-40 blur-[1px]" : ""}>
            <Game onScore={onScore} onGameOver={onGameOver} />
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-5 px-4 text-center text-white">
            <p className="max-w-md text-sm leading-relaxed text-white/80">{howTo}</p>
            <button
              type="button"
              onClick={start}
              className="h-14 rounded-2xl px-10 text-lg font-extrabold text-black shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ background: accent }}
            >
              {t.play}
            </button>
            {!signedIn && (
              <p className="text-xs text-white/60">
                {t.signInToSave}{" "}
                <Link href={loginHref} className="font-bold underline" style={{ color: accent }}>
                  {t.signIn}
                </Link>
              </p>
            )}
          </div>
        )}

        {phase === "over" && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div role="status" className="w-full max-w-xs rounded-2xl border border-white/15 bg-black/80 p-6 text-center text-white shadow-2xl backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-widest text-white/60">{t.gameOver}</p>
              <p className="mt-1 text-5xl font-extrabold tabular-nums">{score}</p>
              <div className="mt-3 min-h-12 space-y-1 text-sm">
                {pending && <p className="text-white/60">{t.saving}</p>}
                {result?.ok && (
                  <>
                    <p className="text-lg font-extrabold" style={{ color: accent }}>
                      {result.xp > 0 ? t.xpGained.replace("{xp}", String(result.xp)) : t.capReached}
                    </p>
                    {result.newBest && <p className="font-bold text-amber-300">{t.newBest}</p>}
                    <p className="text-white/60">
                      {t.todayXp.replace("{today}", String(result.todayXp)).replace("{cap}", String(result.dailyCap))}
                    </p>
                  </>
                )}
                {result && !result.ok && (
                  <p className="text-rose-300">
                    {result.error === "too_fast" ? t.tooFast : result.error === "implausible" ? t.implausible : result.error === "signin" ? t.signInToSave : t.error}
                  </p>
                )}
                {!signedIn && (
                  <p className="text-white/70">
                    {t.signInToSave}{" "}
                    <Link href={loginHref} className="font-bold underline" style={{ color: accent }}>
                      {t.signIn}
                    </Link>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={start}
                disabled={pending}
                className="mt-5 h-12 w-full rounded-xl text-base font-extrabold text-black disabled:opacity-60"
                style={{ background: accent }}
              >
                {t.again}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
