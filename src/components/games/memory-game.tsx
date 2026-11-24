"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./use-board-size";

// 8 eigene Runen-Symbole (einfache Linien-Zeichen)
const RUNES = [
  "M12 3v18M6 9l6-6 6 6",
  "M5 5l14 14M19 5L5 19",
  "M12 3l8 9-8 9-8-9z",
  "M4 12h16M12 4v16M7 7l10 10",
  "M6 4v16M6 12l10-8M6 12l10 8",
  "M12 3a9 9 0 1 0 0 18a5 5 0 1 1 0-10",
  "M4 20L12 4l8 16M8 13h8",
  "M5 8h14M5 16h14M9 4l-2 16M17 4l-2 16",
];
const COLORS = ["#38bdf8", "#f472b6", "#facc15", "#34d399", "#a78bfa", "#fb923c", "#f87171", "#2dd4bf"];

/** Uhr außerhalb der Komponente (nur in Ereignissen verwendet) */
const clock = () => performance.now();

type Card = { id: number; rune: number; open: boolean; done: boolean };

function shuffled(): Card[] {
  const ids = [...RUNES.keys(), ...RUNES.keys()].sort(() => Math.random() - 0.5);
  return ids.map((rune, id) => ({ id, rune, open: false, done: false }));
}

/** Runen-Memory: 8 Paare. Punkte = 1000 − 15 pro Fehlzug − 4 pro Sekunde (mindestens 100). */
export function MemoryGame({ onScore, onGameOver }: GameProps) {
  const [cards, setCards] = useState(shuffled);
  const [lock, setLock] = useState(false);
  const misses = useRef(0);
  const started = useRef<number | null>(null);
  const finished = useRef(false);

  const flip = (i: number) => {
    if (lock || cards[i].open || cards[i].done || finished.current) return;
    if (started.current === null) started.current = clock();
    const next = cards.map((c, k) => (k === i ? { ...c, open: true } : c));
    const open = next.filter((c) => c.open && !c.done);
    setCards(next);
    if (open.length < 2) return;
    if (open[0].rune === open[1].rune) {
      const matched = next.map((c) => (c.open && !c.done ? { ...c, done: true, open: false } : c));
      setCards(matched);
      if (matched.every((c) => c.done)) {
        finished.current = true;
        const secs = (clock() - (started.current ?? clock())) / 1000;
        const score = Math.max(100, Math.round(1000 - misses.current * 15 - secs * 4));
        onScore(score);
        setTimeout(() => onGameOver(score), 500);
      }
    } else {
      misses.current++;
      setLock(true);
      setTimeout(() => {
        setCards((cs) => cs.map((c) => (c.open && !c.done ? { ...c, open: false } : c)));
        setLock(false);
      }, 750);
    }
  };

  // Laufende Anzeige: Zeit/Fehlzüge als vorläufige Punkte
  useEffect(() => {
    const t = setInterval(() => {
      if (started.current === null || finished.current) return;
      const secs = (clock() - started.current) / 1000;
      onScore(Math.max(100, Math.round(1000 - misses.current * 15 - secs * 4)));
    }, 500);
    return () => clearInterval(t);
  }, [onScore]);

  return (
    <div className="mx-auto grid w-full max-w-[440px] grid-cols-4 gap-2.5 sm:gap-3">
      {cards.map((c, i) => {
        const shown = c.open || c.done;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => flip(i)}
            aria-label={shown ? `Rune ${c.rune + 1}` : "Card"}
            className="aspect-[3/4] rounded-xl border transition-all duration-200 active:scale-95"
            style={{
              background: shown ? "#0f2236" : "linear-gradient(145deg,#1e3a5f,#12324a)",
              borderColor: c.done ? COLORS[c.rune] : "rgba(255,255,255,0.08)",
              transform: shown ? "rotateY(0deg)" : "rotateY(180deg)",
              opacity: c.done ? 0.55 : 1,
            }}
          >
            {shown ? (
              <svg viewBox="0 0 24 24" className="mx-auto h-1/2 w-1/2" fill="none" stroke={COLORS[c.rune]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={RUNES[c.rune]} />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="mx-auto h-1/3 w-1/3 opacity-30" fill="none" stroke="#ffffff" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="7" />
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
