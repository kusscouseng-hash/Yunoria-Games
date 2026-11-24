"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Kopfleiste, die beim Runterscrollen verschwindet und beim kleinsten Hochscrollen wiederkommt.
 * Ganz oben ist sie immer sichtbar. Ist das Handy-Menü offen, bleibt sie stehen.
 */
export function AutoHideHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let lastH = document.documentElement.scrollHeight;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight;
      // Seite ist gewachsen (z. B. Bilder nachgeladen) → Browser verschiebt die Position selbst; nicht als Scrollen werten
      if (h !== lastH) {
        lastH = h;
        lastY = y;
        return;
      }
      const delta = y - lastY;
      const menuOpen = !!ref.current?.querySelector('[aria-expanded="true"]');
      if (y < 80 || menuOpen) setHidden(false);
      else if (delta > 6) setHidden(true);
      else if (delta < -4) setHidden(false);
      if (Math.abs(delta) > 4 || y < 80) lastY = y;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Andere klebende Leisten (z. B. im Reader) rücken nach oben, wenn die Kopfleiste weg ist
  useEffect(() => {
    document.documentElement.toggleAttribute("data-header-hidden", hidden);
  }, [hidden]);

  return (
    <header
      ref={ref}
      // Tastatur: Fokus in der Leiste holt sie sofort zurück
      onFocusCapture={() => setHidden(false)}
      className={cn("transition-transform duration-300 ease-out will-change-transform", hidden && "-translate-y-full", className)}
    >
      {children}
    </header>
  );
}
