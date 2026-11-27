"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BoardScaleContext } from "@/components/games/use-board-size";
import { cn } from "@/lib/cn";

/** Zoomstufen: Spielfeld-Faktor (eigene Spiele) und Höhe (eingebettete Spiele) */
const LEVELS = [
  { scale: 0.85, h: "58vh" },
  { scale: 1, h: "72vh" },
  { scale: 1.3, h: "84vh" },
  { scale: 1.65, h: "94vh" },
] as const;
const DEFAULT = 1;
const KEY = "yg-stage-zoom";

type Labels = { zoomIn: string; zoomOut: string; fullscreen: string; exitFullscreen: string; zoom: string };

/**
 * Bühne um das Spiel: Lupe (− / +) zum Vergrößern und Vollbild.
 * Die Leiste darunter zeigt links den Spieltitel (header), rechts die Knöpfe.
 */
export function PlayerStage({ children, header, labels }: { children: ReactNode; header: ReactNode; labels: Labels }) {
  const [level, setLevel] = useState(DEFAULT);
  const [fs, setFs] = useState(false);
  // Ersatz-Vollbild (z. B. iPhone, wo Seiten kein echtes Vollbild anfordern dürfen)
  const [pseudo, setPseudo] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Gespeicherte Zoomstufe nach dem Laden übernehmen
  useEffect(() => {
    let saved = DEFAULT;
    try {
      saved = Number(localStorage.getItem(KEY) ?? DEFAULT);
    } catch {
      /* egal */
    }
    if (Number.isInteger(saved) && saved >= 0 && saved < LEVELS.length && saved !== DEFAULT) {
      const id = requestAnimationFrame(() => setLevel(saved));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // Ersatz-Vollbild: Seite nicht scrollen, mit Escape schließen
  useEffect(() => {
    if (!pseudo) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPseudo(false);
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [pseudo]);

  function change(delta: number) {
    setLevel((l) => {
      const next = Math.min(LEVELS.length - 1, Math.max(0, l + delta));
      try {
        localStorage.setItem(KEY, String(next));
      } catch {
        /* egal */
      }
      return next;
    });
  }

  function toggleFullscreen() {
    if (pseudo) return setPseudo(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    const el = stageRef.current;
    if (!el?.requestFullscreen) return setPseudo(true);
    el.requestFullscreen({ navigationUI: "hide" }).catch(() => setPseudo(true));
  }

  const lv = LEVELS[level];
  const full = fs || pseudo;
  // Im Vollbild: ganzer Bildschirm und größtes Spielfeld
  const style = { "--stage-h": full ? "100dvh" : lv.h } as CSSProperties;
  const btn =
    "flex h-9 min-w-9 items-center justify-center rounded-xl bg-surface-2 px-2.5 text-sm font-bold transition-colors hover:bg-surface-3 disabled:opacity-40";

  return (
    <div className="space-y-3">
      <div
        ref={stageRef}
        style={style}
        data-fs={full ? "" : undefined}
        className={cn(
          "relative",
          full && "flex h-dvh w-screen items-center justify-center overflow-auto bg-black",
          pseudo && "fixed inset-0 z-[100]",
        )}
      >
        <div className="w-full">
          <BoardScaleContext.Provider value={full ? 2 : lv.scale}>{children}</BoardScaleContext.Provider>
        </div>
        {full && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-2 text-sm font-bold text-white shadow-lg ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-black/90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            {labels.exitFullscreen}
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
        <div className="min-w-0 flex-1">{header}</div>
        <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={labels.zoom}>
          <button type="button" onClick={() => change(-1)} disabled={level === 0} aria-label={labels.zoomOut} title={labels.zoomOut} className={btn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5M8 11h6" />
            </svg>
          </button>
          <span className="hidden w-11 text-center text-xs font-bold tabular-nums text-muted sm:inline" aria-live="polite">
            {Math.round(lv.scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => change(1)}
            disabled={level === LEVELS.length - 1}
            aria-label={labels.zoomIn}
            title={labels.zoomIn}
            className={btn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5M8 11h6M11 8v6" />
            </svg>
          </button>
          <button type="button" onClick={toggleFullscreen} aria-label={full ? labels.exitFullscreen : labels.fullscreen} title={labels.fullscreen} className={cn(btn, "bg-accent text-white hover:bg-accent-hover")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
            <span className="ml-1.5 hidden sm:inline">{labels.fullscreen}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
