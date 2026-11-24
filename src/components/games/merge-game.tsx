"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { swipeDirection, useBoardSize, type GameProps } from "./use-board-size";

type Dir = "left" | "right" | "up" | "down";
const N = 4;

const COLORS: Record<number, [string, string]> = {
  2: ["#3f3a35", "#f5f5f4"],
  4: ["#4a3f33", "#f5f5f4"],
  8: ["#c2410c", "#fff7ed"],
  16: ["#ea580c", "#fff7ed"],
  32: ["#f97316", "#fff7ed"],
  64: ["#e11d2e", "#fff1f2"],
  128: ["#ca8a04", "#fefce8"],
  256: ["#eab308", "#1c1917"],
  512: ["#facc15", "#1c1917"],
  1024: ["#a855f7", "#faf5ff"],
  2048: ["#7c3aed", "#faf5ff"],
};

function empty(): number[][] {
  return Array.from({ length: N }, () => Array(N).fill(0));
}

function addRandom(b: number[][]): number[][] {
  const free: [number, number][] = [];
  b.forEach((row, y) => row.forEach((v, x) => v === 0 && free.push([y, x])));
  if (!free.length) return b;
  const [y, x] = free[Math.floor(Math.random() * free.length)];
  const next = b.map((r) => [...r]);
  next[y][x] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

/** Eine Zeile nach links schieben und verschmelzen. */
function slideRow(row: number[]): { row: number[]; gained: number } {
  const vals = row.filter((v) => v);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2);
      gained += vals[i] * 2;
      i++;
    } else out.push(vals[i]);
  }
  while (out.length < N) out.push(0);
  return { row: out, gained };
}

function move(b: number[][], dir: Dir): { board: number[][]; gained: number; moved: boolean } {
  const rotate = (m: number[][]) => m[0].map((_, i) => m.map((r) => r[i]).reverse()); // 90° im Uhrzeigersinn
  const times = { left: 0, down: 1, right: 2, up: 3 }[dir];
  let m = b.map((r) => [...r]);
  for (let i = 0; i < times; i++) m = rotate(m);
  let gained = 0;
  m = m.map((r) => {
    const s = slideRow(r);
    gained += s.gained;
    return s.row;
  });
  for (let i = 0; i < (4 - times) % 4; i++) m = rotate(m);
  const moved = m.some((r, y) => r.some((v, x) => v !== b[y][x]));
  return { board: m, gained, moved };
}

function canMove(b: number[][]) {
  return (["left", "right", "up", "down"] as Dir[]).some((d) => move(b, d).moved);
}

/** Zahlen-Fusion: Kacheln schieben und verschmelzen. Punkte = Summe aller verschmolzenen Werte. */
export function MergeGame({ onScore, onGameOver }: GameProps) {
  const { ref, size } = useBoardSize<HTMLDivElement>(440);
  const [board, setBoard] = useState(() => addRandom(addRandom(empty())));
  const boardRef = useRef(board);
  const score = useRef(0);
  const done = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const doMove = useCallback(
    (dir: Dir) => {
      if (done.current) return;
      const r = move(boardRef.current, dir);
      if (!r.moved) return;
      const next = addRandom(r.board);
      boardRef.current = next;
      setBoard(next);
      if (r.gained) {
        score.current += r.gained;
        onScore(score.current);
      }
      if (!canMove(next)) {
        done.current = true;
        setTimeout(() => onGameOver(score.current), 400);
      }
    },
    [onScore, onGameOver],
  );

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      doMove(d);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [doMove]);

  const gap = Math.round(size * 0.025);
  const cell = (size - gap * (N + 1)) / N;

  return (
    <div ref={ref} className="w-full">
      <div
        className="relative mx-auto touch-none select-none rounded-2xl bg-[#2a2420]"
        style={{ width: size, height: size }}
        onPointerDown={(e) => (touch.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          if (!touch.current) return;
          const d = swipeDirection(e.clientX - touch.current.x, e.clientY - touch.current.y);
          touch.current = null;
          if (d) doMove(d);
        }}
      >
        {board.map((row, y) =>
          row.map((v, x) => {
            const [bg, fg] = COLORS[v] ?? ["#4c1d95", "#faf5ff"];
            return (
              <div
                key={`${y}-${x}`}
                className="absolute flex items-center justify-center rounded-xl font-extrabold transition-colors duration-100"
                style={{
                  left: gap + x * (cell + gap),
                  top: gap + y * (cell + gap),
                  width: cell,
                  height: cell,
                  background: v ? bg : "#3a322c",
                  color: fg,
                  fontSize: cell * (v >= 1024 ? 0.3 : v >= 128 ? 0.36 : 0.42),
                  boxShadow: v >= 128 ? `0 0 ${cell * 0.25}px ${bg}88` : undefined,
                }}
              >
                {v || ""}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
