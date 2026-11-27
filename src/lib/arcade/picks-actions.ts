"use server";

import { updateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PICKS_TAG, providerCatalog } from "./sources";
import { isArcadeSource } from "./types";

/**
 * Spiel in die handverlesene Auswahl aufnehmen oder entfernen (nur Admins).
 * Die Spieldaten kommen nicht aus dem Formular, sondern frisch aus dem Katalog des Anbieters.
 * Zusätzlich prüft die Datenbank per RLS (is_admin()).
 */
export async function togglePick(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return;

  const source = String(fd.get("source") ?? "");
  const id = String(fd.get("id") ?? "");
  const mode = String(fd.get("mode") ?? "");
  if (!isArcadeSource(source) || !/^[a-z0-9-]{1,120}$/.test(id)) return;

  const supabase = await createClient();
  if (mode === "remove") {
    await supabase.from("arcade_picks").delete().eq("game_id", id);
  } else if (mode === "add") {
    const game = (await providerCatalog(source)).find((g) => g.id === id);
    if (!game) return;
    // Schon ausgewählt → Datenbank meldet doppelten Schlüssel, das ist egal
    await supabase.from("arcade_picks").insert({
      source: game.source,
      game_id: game.id,
      title: game.title,
      description: game.description,
      category: game.category,
      width: Math.min(Math.max(game.width, 50), 4000),
      height: Math.min(Math.max(game.height, 50), 4000),
      banner: game.banner,
      icon: game.icon,
    });
  } else {
    return;
  }
  updateTag(PICKS_TAG);
}

/**
 * Spiel für alle verstecken oder wieder zeigen (nur Admins). Versteckte Spiele fliegen
 * auch aus der Auswahl und erscheinen nirgends mehr auf der Seite.
 */
export async function toggleHidden(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return;

  const source = String(fd.get("source") ?? "");
  const id = String(fd.get("id") ?? "");
  const mode = String(fd.get("mode") ?? "");
  if (!isArcadeSource(source) || !/^[a-z0-9-]{1,120}$/.test(id)) return;

  const supabase = await createClient();
  if (mode === "show") {
    await supabase.from("arcade_hidden").delete().eq("game_id", id);
  } else if (mode === "hide") {
    const game = (await providerCatalog(source)).find((g) => g.id === id);
    if (!game) return;
    // Schon versteckt → doppelter Schlüssel, das ist egal
    await supabase.from("arcade_hidden").insert({ game_id: game.id, source: game.source, title: game.title, banner: game.banner });
    await supabase.from("arcade_picks").delete().eq("game_id", id);
  } else {
    return;
  }
  updateTag(PICKS_TAG);
}
