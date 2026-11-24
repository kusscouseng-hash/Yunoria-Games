"use client";

import { useEffect, useRef } from "react";
import { useBoardSize, type GameProps } from "./use-board-size";

type Drop = { x: number; y: number; r: number; vy: number; kind: "star" | "gold" | "meteor"; spin: number };

/** Sternenfänger: Sterne fangen, Meteoren ausweichen. Punkte: Stern 1, goldener Stern 5. */
export function StarsGame({ onScore, onGameOver }: GameProps) {
  const { ref, size } = useBoardSize<HTMLDivElement>(480);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = size;
  const H = Math.round(size * 1.25);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const unit = W / 24;
    const player = { x: W / 2, w: unit * 4.2, h: unit * 1.1 };
    let target = player.x;
    let drops: Drop[] = [];
    let score = 0;
    let lives = 3;
    let t = 0;
    let spawn = 0;
    let last = performance.now();
    let raf = 0;
    let over = false;
    let hurt = 0;
    const keys = { left: false, right: false };
    const bg = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.5 + 0.3 }));

    const spawnDrop = () => {
      const level = Math.min(1, t / 90);
      const roll = Math.random();
      const kind: Drop["kind"] = roll < 0.18 + level * 0.17 ? "meteor" : roll > 0.93 ? "gold" : "star";
      const r = kind === "meteor" ? unit * (0.9 + Math.random() * 0.5) : unit * 0.75;
      drops.push({ x: r + Math.random() * (W - 2 * r), y: -r, r, vy: unit * (5 + level * 7 + Math.random() * 2), kind, spin: Math.random() * 6 });
    };

    const drawStar = (x: number, y: number, r: number, rot: number, color: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = r;
      ctx.fill();
      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      // Steuerung
      if (keys.left) target -= unit * 22 * dt;
      if (keys.right) target += unit * 22 * dt;
      target = Math.max(player.w / 2, Math.min(W - player.w / 2, target));
      player.x += (target - player.x) * Math.min(1, dt * 18);

      spawn -= dt;
      if (spawn <= 0) {
        spawnDrop();
        spawn = Math.max(0.35, 0.9 - t / 150);
      }
      const py = H - unit * 2;
      for (const d of drops) {
        d.y += d.vy * dt;
        d.spin += dt * 2;
      }
      drops = drops.filter((d) => {
        const caught = d.y + d.r > py - player.h / 2 && d.y - d.r < py + player.h / 2 && Math.abs(d.x - player.x) < player.w / 2 + d.r * 0.6;
        if (caught) {
          if (d.kind === "meteor") {
            lives--;
            hurt = 0.4;
          } else {
            score += d.kind === "gold" ? 5 : 1;
            onScore(score);
          }
          return false;
        }
        return d.y - d.r < H;
      });
      hurt = Math.max(0, hurt - dt);

      // Zeichnen
      ctx.fillStyle = "#0b0d24";
      ctx.fillRect(0, 0, W, H);
      for (const s of bg) {
        s.y += s.s * 12 * dt;
        if (s.y > H) s.y = 0;
        ctx.fillStyle = `rgba(255,255,255,${0.25 + s.s * 0.3})`;
        ctx.fillRect(s.x, s.y, s.s, s.s);
      }
      for (const d of drops) {
        if (d.kind === "meteor") {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.fillStyle = "rgba(251,113,133,0.25)";
          ctx.beginPath();
          ctx.ellipse(0, -d.r * 1.4, d.r * 0.6, d.r * 1.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#7c4a3a";
          ctx.beginPath();
          ctx.arc(0, 0, d.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#5a3328";
          ctx.beginPath();
          ctx.arc(-d.r * 0.3, -d.r * 0.2, d.r * 0.25, 0, Math.PI * 2);
          ctx.arc(d.r * 0.35, d.r * 0.3, d.r * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          drawStar(d.x, d.y, d.kind === "gold" ? d.r * 1.25 : d.r, d.spin, d.kind === "gold" ? "#fbbf24" : "#e0e7ff");
        }
      }
      // Fänger
      ctx.save();
      ctx.translate(player.x, py);
      ctx.fillStyle = hurt > 0 ? "#fb7185" : "#a78bfa";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, player.h / 2);
      ctx.fill();
      ctx.restore();
      // Leben
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < lives ? "#fb7185" : "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.arc(W - unit * (1.2 + i * 1.3), unit * 1.2, unit * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      if (lives <= 0) {
        over = true;
        onGameOver(score);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const pointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target = ((e.clientX - r.left) / r.width) * W;
    };
    const key = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.left = down;
      else if (e.key === "ArrowRight" || e.key === "d") keys.right = down;
      else return;
      e.preventDefault();
    };
    const kd = key(true);
    const ku = key(false);
    canvas.addEventListener("pointermove", pointer);
    canvas.addEventListener("pointerdown", pointer);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      if (!over) cancelAnimationFrame(raf);
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", pointer);
      canvas.removeEventListener("pointerdown", pointer);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
    // Spielfeldgröße wird beim Start festgelegt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className="w-full">
      <canvas ref={canvasRef} style={{ width: W, height: H }} className="mx-auto block touch-none rounded-2xl" />
    </div>
  );
}
