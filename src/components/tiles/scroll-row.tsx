"use client";

import { useCallback, useRef, useState } from "react";

/** Waagerechte Reihe zum Wischen, mit Pfeilen links/rechts (ab Tablet, nur wenn es etwas zu scrollen gibt). */
export function ScrollRow({ children, prevLabel, nextLabel }: { children: React.ReactNode; prevLabel: string; nextLabel: string }) {
  const el = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const n = el.current;
    if (!n) return;
    const left = n.scrollLeft > 4;
    const right = n.scrollLeft + n.clientWidth < n.scrollWidth - 4;
    setEdges((e) => (e.left === left && e.right === right ? e : { left, right }));
  }, []);

  // Beim Einhängen und bei Größenänderung prüfen, ob gescrollt werden kann
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      el.current = node;
      if (!node) return;
      const ro = new ResizeObserver(update);
      ro.observe(node);
      return () => ro.disconnect();
    },
    [update],
  );

  // Mit der Maus ziehen (wie beim Karussell oben) – mit Schwung beim Loslassen.
  // Finger/Touch nutzen das eingebaute, flüssige Scrollen des Browsers.
  const drag = useRef<{ id: number; x: number; left: number; lastX: number; lastT: number; v: number; moved: boolean } | null>(null);
  const momentum = useRef<number | null>(null);
  const stopMomentum = () => {
    if (momentum.current) cancelAnimationFrame(momentum.current);
    momentum.current = null;
  };
  const setFree = (n: HTMLDivElement, free: boolean) => {
    n.style.scrollSnapType = free ? "none" : "";
    n.style.scrollBehavior = free ? "auto" : "";
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !el.current) return;
    stopMomentum();
    const n = el.current;
    drag.current = { id: e.pointerId, x: e.clientX, left: n.scrollLeft, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const n = el.current;
    if (!d || !n || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      setFree(n, true);
      n.setPointerCapture(e.pointerId);
      n.style.cursor = "grabbing";
    }
    if (!d.moved) return;
    n.scrollLeft = d.left - dx;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.v = 0.8 * ((d.lastX - e.clientX) / dt) + 0.2 * d.v; // px pro ms
    d.lastX = e.clientX;
    d.lastT = now;
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const n = el.current;
    if (!d || !n || d.id !== e.pointerId) return;
    drag.current = null;
    n.style.cursor = "";
    if (!d.moved) return;
    // Klick auf eine Karte nach dem Ziehen verhindern
    const block = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    n.addEventListener("click", block, { capture: true, once: true });
    setTimeout(() => n.removeEventListener("click", block, { capture: true }), 0);
    // Schwung ausrollen lassen
    let v = d.v * 16; // px pro Frame
    const step = () => {
      if (!el.current || Math.abs(v) < 0.4) {
        momentum.current = null;
        if (el.current) setFree(el.current, false);
        return;
      }
      el.current.scrollLeft += v;
      v *= 0.94;
      momentum.current = requestAnimationFrame(step);
    };
    momentum.current = requestAnimationFrame(step);
  };

  const go = (dir: 1 | -1) => el.current?.scrollBy({ left: dir * el.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow =
    "absolute top-[42%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-lg text-foreground shadow-lg backdrop-blur transition-colors hover:bg-accent hover:text-white md:flex";
  return (
    <div className="relative">
      {edges.left && (
        <button type="button" onClick={() => go(-1)} aria-label={prevLabel} className={`${arrow} -left-2`}>
          ‹
        </button>
      )}
      <div
        ref={attach}
        onScroll={update}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        className="-mx-4 flex cursor-grab snap-x snap-proximity scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 pt-1 select-none [scrollbar-width:none] [-webkit-overflow-scrolling:touch] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {edges.right && (
        <button type="button" onClick={() => go(1)} aria-label={nextLabel} className={`${arrow} -right-2`}>
          ›
        </button>
      )}
    </div>
  );
}
