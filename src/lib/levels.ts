/**
 * Level-Berechnung aus den Gesamt-XP (vom Inhaber bestätigt, 2026-11-17):
 * - 10 XP pro vollständig gelesenem Kapitel
 * - XP von Level L zu L+1 = 100 + (L − 1) × 20
 * Level, Rang und Titel werden immer aus total_xp berechnet und nie gespeichert –
 * deshalb geht beim Wechsel des Rangsystems nie etwas verloren.
 */
import { RANK_SYSTEMS, type RankSystemId } from "./ranks";

export const XP_PER_CHAPTER = 10;
export const MAX_LEVEL = 999;

/** XP, die man von Level `level` zu `level + 1` braucht. */
export function xpForLevelUp(level: number): number {
  return 100 + (level - 1) * 20;
}

/** Gesamt-XP, ab denen man `level` erreicht (Level 1 = 0 XP). */
export function totalXpForLevel(level: number): number {
  // Summe der arithmetischen Reihe 100, 120, 140, … für die Level 1 … level-1
  const n = level - 1;
  return n * 100 + (n * (n - 1) * 20) / 2;
}

export type LevelInfo = {
  level: number;
  /** XP innerhalb des aktuellen Levels */
  xpIntoLevel: number;
  /** XP, die das aktuelle Level insgesamt braucht */
  xpForNext: number;
  /** Fortschritt 0–1 */
  progress: number;
};

export function levelFromXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0));
  let level = 1;
  while (level < MAX_LEVEL && totalXpForLevel(level + 1) <= xp) level++;
  const xpIntoLevel = xp - totalXpForLevel(level);
  const xpForNext = xpForLevelUp(level);
  return { level, xpIntoLevel, xpForNext, progress: level >= MAX_LEVEL ? 1 : xpIntoLevel / xpForNext };
}

/** Rang im gewählten System für ein Level – plus der nächste Rang (falls vorhanden). */
export function rankForLevel(system: RankSystemId, level: number) {
  const ranks = RANK_SYSTEMS[system].ranks;
  let index = 0;
  for (let i = 0; i < ranks.length; i++) if (level >= ranks[i].minLevel) index = i;
  return { current: ranks[index], next: ranks[index + 1] ?? null, index, total: ranks.length };
}
