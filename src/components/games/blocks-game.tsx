"use client";

import { useEffect, useRef } from "react";
import { useBoardSize, type GameProps } from "./use-board-size";

const COLS = 10;
const ROWS = 20;
const SHAPES: { cells: number[][]; color: string }[] = [
  { cells: [[1, 1, 1, 1]], color: "#38bdf8" },
  { cells: [[1, 1], [1, 1]], color: "#facc15" },
  { cells: [[0, 1, 0], [1, 1, 1]], color: "#a78bfa" },
  { cells: [[1, 0, 0], [1, 1, 1]], color: "#60a5fa" },
  { cells: [[0, 0, 1], [1, 1, 1]], color: "#fb923c" },
  { cells: [[0, 1, 1], [1, 1, 0]], color: "#34d399" },
  { cells: [[1, 1, 0], [0, 1, 1]], color: "#fb7185" },
];
const LINE_POINTS = [0, 100, 300, 500, 800];

type Piece = { cells: number[][]; color: string; x: number; y: number };

/** Block-Fall: Reihen abräumen. 1/2/3/4 Reihen = 100/300/500/800 Punkte, schnelles Fallen +1 pro Feld. */
export function BlocksGame({ onScore, onGameOver }: GameProps) {
  const { ref, size } = useBoardSize<HTMLDivElement>(320);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useRef<{ act: (a: "left" | "right" | "rotate" | "down" | "drop") => void } | null>(null);
  const W = size;
  const H = size * 2;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = W / COLS;

    const grid: (string | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let bag: number[] = [];
    const nextShape = () => {
      if (!bag.length) bag = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
      const s = SHAPES[bag.pop()!];
      return { cells: s.cells.map((r) => [...r]), color: s.color, x: Math.floor((COLS - s.cells[0].length) / 2), y: 0 } as Piece;
    };
    let piece = nextShape();
    let score = 0;
    let lines = 0;
    let fall = 0;
    let last = performance.now();
    let raf = 0;
    let over = false;

    const fits = (p: Piece, dx = 0, dy = 0, cells = p.cells) =>
      cells.every((row, y) =>
        row.every((v, x) => {
          if (!v) return true;
          const nx = p.x + x + dx;
          const ny = p.y + y + dy;
          return nx >= 0 && nx < COLS && ny < ROWS && (ny < 0 || !grid[ny][nx]);
        }),
      );
    const speed = () => Math.max(0.08, 0.8 - Math.floor(lines / 10) * 0.07);

    const lock = () => {
      piece.cells.forEach((row, y) => row.forEach((v, x) => v && piece.y + y >= 0 && (grid[piece.y + y][piece.x + x] = piece.color)));
      let cleared = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (grid[y].every(Boolean)) {
          grid.splice(y, 1);
          grid.unshift(Array(COLS).fill(null));
          cleared++;
          y++;
        }
      }
      if (cleared) {
        lines += cleared;
        score += LINE_POINTS[cleared];
      }
      onScore(score);
      piece = nextShape();
      if (!fits(piece)) over = true;
    };

    const act = (a: "left" | "right" | "rotate" | "down" | "drop") => {
      if (over) return;
      if (a === "left" && fits(piece, -1)) piece.x--;
      if (a === "right" && fits(piece, 1)) piece.x++;
      if (a === "down") {
        if (fits(piece, 0, 1)) {
          piece.y++;
          score += 1;
          onScore(score);
        } else lock();
        fall = 0;
      }
      if (a === "drop") {
        while (fits(piece, 0, 1)) {
          piece.y++;
          score += 1;
        }
        lock();
        fall = 0;
      }
      if (a === "rotate") {
        const rot = piece.cells[0].map((_, i) => piece.cells.map((r) => r[i]).reverse());
        for (const kick of [0, -1, 1, -2, 2]) {
          if (fits(piece, kick, 0, rot)) {
            piece.cells = rot;
            piece.x += kick;
            break;
          }
        }
      }
    };
    controls.current = { act };

    const cellDraw = (x: number, y: number, color: string, alpha = 1) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x * c + 1, y * c + 1, c - 2, c - 2, c * 0.18);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(x * c + 3, y * c + 3, c - 6, c * 0.18);
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      fall += dt;
      if (fall >= speed()) {
        fall = 0;
        if (fits(piece, 0, 1)) piece.y++;
        else lock();
      }
      ctx.fillStyle = "#120f24";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(167,139,250,0.07)";
      for (let x = 1; x < COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * c, 0);
        ctx.lineTo(x * c, H);
        ctx.stroke();
      }
      grid.forEach((row, y) => row.forEach((col, x) => col && cellDraw(x, y, col)));
      // Schatten (wo der Block landet)
      let ghost = 0;
      while (fits(piece, 0, ghost + 1)) ghost++;
      piece.cells.forEach((row, y) => row.forEach((v, x) => v && cellDraw(piece.x + x, piece.y + y + ghost, piece.color, 0.18)));
      piece.cells.forEach((row, y) => row.forEach((v, x) => v && cellDraw(piece.x + x, piece.y + y, piece.color)));
      if (over) {
        onGameOver(score);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const key = (e: KeyboardEvent) => {
      const m: Record<string, "left" | "right" | "rotate" | "down" | "drop"> = {
        ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right", ArrowUp: "rotate", w: "rotate", ArrowDown: "down", s: "down", " ": "drop",
      };
      const a = m[e.key];
      if (!a) return;
      e.preventDefault();
      act(a);
    };
    window.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", key);
      controls.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const btn = "flex h-12 flex-1 items-center justify-center rounded-xl bg-white/10 text-white active:bg-white/25";
  const icon = (d: string) => (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
  return (
    <div ref={ref} className="mx-auto w-full max-w-[320px]">
      <canvas ref={canvasRef} style={{ width: W, height: H }} className="mx-auto block touch-none rounded-2xl" />
      <div className="mt-3 flex gap-2">
        <button type="button" className={btn} aria-label="Left" onClick={() => controls.current?.act("left")}>{icon("M15 6l-6 6 6 6")}</button>
        <button type="button" className={btn} aria-label="Rotate" onClick={() => controls.current?.act("rotate")}>{icon("M20 12a8 8 0 1 1-3-6.2M20 4v5h-5")}</button>
        <button type="button" className={btn} aria-label="Down" onClick={() => controls.current?.act("down")}>{icon("M6 9l6 6 6-6")}</button>
        <button type="button" className={btn} aria-label="Drop" onClick={() => controls.current?.act("drop")}>{icon("M12 4v12M6 12l6 6 6-6M5 21h14")}</button>
        <button type="button" className={btn} aria-label="Right" onClick={() => controls.current?.act("right")}>{icon("M9 6l6 6-6 6")}</button>
      </div>
    </div>
  );
}
