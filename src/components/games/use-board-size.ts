"use client";

import { useEffect, useRef, useState } from "react";

/** Misst die verfügbare Breite eines Containers (für quadratische/feste Spielfelder). */
export function useBoardSize<T extends HTMLElement>(max: number) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(max);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize(Math.max(200, Math.min(max, Math.floor(el.clientWidth))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [max]);
  return { ref, size };
}

/** Wischgeste erkennen (für Handy-Steuerung). */
export function swipeDirection(dx: number, dy: number, min = 24): "left" | "right" | "up" | "down" | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
}

export type GameProps = {
  /** aktueller Punktestand (für die Anzeige im Rahmen) */
  onScore: (score: number) => void;
  /** Runde vorbei – endgültiger Punktestand */
  onGameOver: (score: number) => void;
};
