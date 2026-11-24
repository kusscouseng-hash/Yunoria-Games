"use client";

import { useEffect, useRef } from "react";
import { swipeDirection, useBoardSize, type GameProps } from "./use-board-size";

type P = { x: number; y: number };
const G = 20; // Feld 20 × 20

/** Neon-Schlange: jede Kugel = 10 Punkte, die Schlange wird länger und schneller. */
export function SnakeGame({ onScore, onGameOver }: GameProps) {
  const { ref, size } = useBoardSize<HTMLDivElement>(460);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const S = size;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = S / G;

    const snake: P[] = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    let dir: P = { x: 1, y: 0 };
    const queue: P[] = [];
    let food = place();
    let score = 0;
    let step = 0.14;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    let alive = true;

    function place(): P {
      for (;;) {
        const p = { x: Math.floor(Math.random() * G), y: Math.floor(Math.random() * G) };
        if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
      }
    }

    const turn = (d: P) => {
      const ref = queue[queue.length - 1] ?? dir;
      if (d.x === -ref.x && d.y === -ref.y) return; // nicht umdrehen
      if (d.x === ref.x && d.y === ref.y) return;
      if (queue.length < 3) queue.push(d);
    };

    const tick = () => {
      if (queue.length) dir = queue.shift()!;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= G || head.y >= G || snake.some((s) => s.x === head.x && s.y === head.y)) {
        alive = false;
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        onScore(score);
        food = place();
        step = Math.max(0.06, step * 0.97);
      } else snake.pop();
    };

    const draw = (now: number) => {
      ctx.fillStyle = "#06150f";
      ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = "rgba(52,211,153,0.06)";
      ctx.lineWidth = 1;
      for (let i = 1; i < G; i++) {
        ctx.beginPath();
        ctx.moveTo(i * c, 0);
        ctx.lineTo(i * c, S);
        ctx.moveTo(0, i * c);
        ctx.lineTo(S, i * c);
        ctx.stroke();
      }
      const pulse = 0.8 + Math.sin(now / 180) * 0.2;
      ctx.fillStyle = "#f472b6";
      ctx.shadowColor = "#f472b6";
      ctx.shadowBlur = c * 0.8;
      ctx.beginPath();
      ctx.arc(food.x * c + c / 2, food.y * c + c / 2, (c / 2.6) * pulse, 0, Math.PI * 2);
      ctx.fill();
      snake.forEach((s, i) => {
        const k = 1 - i / (snake.length + 6);
        ctx.fillStyle = `rgba(52,211,153,${0.35 + k * 0.65})`;
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = i === 0 ? c : c * 0.4;
        ctx.beginPath();
        ctx.roundRect(s.x * c + 1.5, s.y * c + 1.5, c - 3, c - 3, c * 0.3);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= step && alive) {
        acc -= step;
        tick();
      }
      draw(now);
      if (!alive) {
        onGameOver(score);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const key = (e: KeyboardEvent) => {
      const m: Record<string, P> = {
        ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
      };
      const d = m[e.key];
      if (!d) return;
      e.preventDefault();
      turn(d);
    };
    let start: P | null = null;
    const down = (e: PointerEvent) => (start = { x: e.clientX, y: e.clientY });
    const move = (e: PointerEvent) => {
      if (!start) return;
      const d = swipeDirection(e.clientX - start.x, e.clientY - start.y, 18);
      if (!d) return;
      turn({ left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } }[d]);
      start = { x: e.clientX, y: e.clientY };
    };
    const up = () => (start = null);
    window.addEventListener("keydown", key);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", key);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className="w-full">
      <canvas ref={canvasRef} style={{ width: S, height: S }} className="mx-auto block touch-none rounded-2xl" />
    </div>
  );
}
