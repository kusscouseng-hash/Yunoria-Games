"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { defaultLocale, hasLocale, withLocale } from "@/i18n/config";
import { isGameRankSystem } from "@/lib/game-ranks";
import { safeNextPath } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

/**
 * Spiele-Rangsystem wechseln. Ändert nur die Anzeige – XP und Level bleiben unverändert.
 */
export async function updateRankSystem(formData: FormData): Promise<void> {
  const lang = String(formData.get("locale") ?? "");
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const system = String(formData.get("rank_system") ?? "");
  const account = safeNextPath(String(formData.get("return_to") ?? ""), withLocale(locale, "/account"));
  const back = (query: string) => `${account}${account.includes("?") ? "&" : "?"}${query}`;

  if (!isGameRankSystem(system)) redirect(back("error=rank"));

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect(`${withLocale(locale, "/login")}?next=${encodeURIComponent(account)}`);

  const { error } = await supabase.rpc("set_game_rank_system", { p_system: system });
  redirect(error ? back("error=rank") : back("saved=rank"));
}

// ---------------------------------------------------------------------------
// Profilbild
// ---------------------------------------------------------------------------
export type AvatarState = { error?: "type" | "size" | "generic"; ok?: number };

const AVATAR_MAX_BYTES = 4 * 1024 * 1024; // Server-Actions erlauben max. 4,5 MB
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Lädt ein Profilbild hoch: auf 256×256 zugeschnitten, als WebP, im eigenen Ordner. "remove" löscht es. */
export async function updateAvatar(_prev: AvatarState, fd: FormData): Promise<AvatarState> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "generic" };

  // Alte Bilder des Nutzers aufräumen
  const cleanup = async (keep?: string) => {
    const { data: files } = await supabase.storage.from("avatars").list(userId);
    const old = (files ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
    if (old.length) await supabase.storage.from("avatars").remove(old);
  };

  if (fd.get("remove") === "1") {
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    await cleanup();
    refresh();
    return { ok: Date.now() };
  }

  const file = fd.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "type" };
  if (file.size > AVATAR_MAX_BYTES) return { error: "size" };
  if (!AVATAR_TYPES.includes(file.type)) return { error: "type" };

  let bytes: Buffer;
  try {
    const sharp = (await import("sharp")).default;
    bytes = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error", animated: false })
      .rotate()
      .resize(256, 256, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { error: "type" };
  }

  const path = `${userId}/${Date.now()}.webp`;
  const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, { contentType: "image/webp", cacheControl: "31536000" });
  if (upErr) return { error: "generic" };
  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", userId);
  if (error) return { error: "generic" };
  await cleanup(path);
  refresh();
  return { ok: Date.now() };
}

// ---------------------------------------------------------------------------
// Titel auswählen (die Datenbank prüft, ob er freigeschaltet ist)
// ---------------------------------------------------------------------------
export async function chooseTitle(fd: FormData): Promise<void> {
  const supabase = await createClient();
  const raw = String(fd.get("title") ?? "");
  await supabase.rpc("set_title", { p_title: raw || null });
  refresh();
}

// ---------------------------------------------------------------------------
// Benutzername ändern (Datenbank prüft zusätzlich: reservierte Namen, max. alle 7 Tage)
// ---------------------------------------------------------------------------
export type UsernameState = { error?: "invalid" | "taken" | "reserved" | "cooldown" | "same" | "generic"; ok?: string };

export async function updateUsername(_prev: UsernameState, fd: FormData): Promise<UsernameState> {
  const { isValidUsername, isReservedUsername } = await import("@/lib/auth/validation");
  const username = String(fd.get("username") ?? "").trim();
  if (!isValidUsername(username)) return { error: "invalid" };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "generic" };

  const { data: me } = await supabase.from("profiles").select("username, role").eq("id", userId).single();
  if (!me) return { error: "generic" };
  if (me.username === username) return { error: "same" };
  if (me.role !== "admin" && isReservedUsername(username)) return { error: "reserved" };
  // Nur Groß-/Kleinschreibung geändert? Dann ist der Name "frei" (gehört ja einem selbst)
  if (me.username.toLowerCase() !== username.toLowerCase()) {
    const { data: available } = await supabase.rpc("username_available", { name: username });
    if (!available) return { error: "taken" };
  }

  const { error } = await supabase.from("profiles").update({ username }).eq("id", userId);
  if (error) {
    if (error.message.includes("username_cooldown")) return { error: "cooldown" };
    if (error.message.includes("username_reserved")) return { error: "reserved" };
    if (error.code === "23505") return { error: "taken" };
    return { error: "generic" };
  }
  refresh();
  return { ok: username };
}

// ---------------------------------------------------------------------------
// Bio
// ---------------------------------------------------------------------------
export type BioState = { ok?: number; error?: boolean };
export async function updateBio(_prev: BioState, fd: FormData): Promise<BioState> {
  const bio = String(fd.get("bio") ?? "").trim().slice(0, 300) || null;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: true };
  const { error } = await supabase.from("profiles").update({ bio }).eq("id", userId);
  if (error) return { error: true };
  refresh();
  return { ok: Date.now() };
}
