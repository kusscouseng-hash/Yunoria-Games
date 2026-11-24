"use client";

import { useEffect } from "react";
import { recordActivity } from "@/lib/guilds/actions";

const KEY = "activity-ping";

/** Zählt einen Besuch für den eigenen Aktivitäts-Kalender – höchstens alle 30 Minuten. */
export function ActivityPing() {
  useEffect(() => {
    try {
      const last = Number(localStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < 30 * 60 * 1000) return;
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
    void recordActivity().catch(() => {});
  }, []);
  return null;
}
