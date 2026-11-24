"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { defaultLocale, hasLocale, withLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import type { GuildColor } from "@/lib/supabase/database.types";
import type { AvatarState } from "@/lib/profile/actions";

const COLORS: GuildColor[] = ["red", "orange", "amber", "green", "teal", "blue", "violet", "pink"];
export type GuildError = "level_too_low" | "already_in_guild" | "guild_full" | "guild_closed" | "name" | "tag" | "taken" | "not_allowed" | "rename_cooldown" | "generic";
export type GuildFormState = { error?: GuildError };

const localeOf = (fd: FormData) => {
  const v = String(fd.get("locale") ?? "");
  return hasLocale(v) ? v : defaultLocale;
};

function mapError(e: { code?: string; message?: string } | null): GuildError {
  const m = e?.message ?? "";
  if (m.includes("level_too_low")) return "level_too_low";
  if (m.includes("already_in_guild")) return "already_in_guild";
  if (m.includes("guild_full")) return "guild_full";
  if (m.includes("guild_closed")) return "guild_closed";
  if (m.includes("not_allowed")) return "not_allowed";
  if (m.includes("rename_cooldown")) return "rename_cooldown";
  if (e?.code === "23505") return "taken";
  if (m.includes("guild_tag_format")) return "tag";
  if (m.includes("guild_name_format")) return "name";
  return "generic";
}

async function signedIn(locale: Locale, next: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect(`${withLocale(locale, "/login")}?next=${encodeURIComponent(withLocale(locale, next))}`);
  return supabase;
}

/** Gilde gründen (Prüfung von Level, Name und Kürzel passiert in der Datenbank). */
export async function createGuild(_prev: GuildFormState, fd: FormData): Promise<GuildFormState> {
  const locale = localeOf(fd);
  const name = String(fd.get("name") ?? "").trim().replace(/\s+/g, " ");
  const tag = String(fd.get("tag") ?? "").trim().toUpperCase();
  const description = String(fd.get("description") ?? "").trim().slice(0, 300);
  const emblem = [...String(fd.get("emblem") ?? "").trim()].slice(0, 2).join("") || "⚔️";
  const colorRaw = String(fd.get("color") ?? "red");
  const color = (COLORS as string[]).includes(colorRaw) ? (colorRaw as GuildColor) : "red";
  if (name.length < 3 || name.length > 32) return { error: "name" };
  if (!/^[A-Z0-9]{2,5}$/.test(tag)) return { error: "tag" };

  const supabase = await signedIn(locale, "/guilds/new");
  const { error } = await supabase.rpc("create_guild", { p_name: name, p_tag: tag, p_description: description || null, p_emblem: emblem, p_color: color });
  if (error) return { error: mapError(error) };
  redirect(withLocale(locale, `/guilds/${tag}`));
}

export async function joinGuild(fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  const tag = String(fd.get("tag") ?? "");
  const supabase = await signedIn(locale, `/guilds/${tag}`);
  const { error } = await supabase.rpc("join_guild", { p_guild: String(fd.get("guild_id") ?? "") });
  redirect(`${withLocale(locale, `/guilds/${tag}`)}${error ? `?error=${mapError(error)}` : "?joined=1"}`);
}

export async function leaveGuild(fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  const tag = String(fd.get("tag") ?? "");
  const supabase = await signedIn(locale, `/guilds/${tag}`);
  const { error } = await supabase.rpc("leave_guild", {});
  redirect(error ? `${withLocale(locale, `/guilds/${tag}`)}?error=generic` : `${withLocale(locale, "/guilds")}?left=1`);
}

export async function kickMember(fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  const tag = String(fd.get("tag") ?? "");
  const supabase = await signedIn(locale, `/guilds/${tag}`);
  const { error } = await supabase.rpc("kick_guild_member", { p_user: String(fd.get("user_id") ?? "") });
  redirect(`${withLocale(locale, `/guilds/${tag}`)}${error ? `?error=${mapError(error)}` : ""}`);
}

export async function setMemberRole(fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  const tag = String(fd.get("tag") ?? "");
  const role = fd.get("role") === "officer" ? "officer" : "member";
  const supabase = await signedIn(locale, `/guilds/${tag}`);
  const { error } = await supabase.rpc("set_guild_role", { p_user: String(fd.get("user_id") ?? ""), p_role: role });
  redirect(`${withLocale(locale, `/guilds/${tag}`)}${error ? `?error=${mapError(error)}` : ""}`);
}

export async function updateGuild(fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  const tag = String(fd.get("tag") ?? "");
  const colorRaw = String(fd.get("color") ?? "");
  const supabase = await signedIn(locale, `/guilds/${tag}`);
  const { error } = await supabase.rpc("update_guild", {
    p_description: String(fd.get("description") ?? "").trim().slice(0, 300) || null,
    p_emblem: [...String(fd.get("emblem") ?? "").trim()].slice(0, 2).join("") || null,
    p_color: (COLORS as string[]).includes(colorRaw) ? (colorRaw as GuildColor) : null,
    p_is_open: fd.get("is_open") === "on",
  });
  redirect(`${withLocale(locale, `/guilds/${tag}`)}${error ? `?error=${mapError(error)}` : "?saved=1"}`);
}

/** Gildennamen ändern (nur Anführer, höchstens alle 7 Tage – prüft die Datenbank). */
export async function renameGuild(fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  const tag = String(fd.get("tag") ?? "");
  const name = String(fd.get("name") ?? "").trim().replace(/\s+/g, " ");
  const supabase = await signedIn(locale, `/guilds/${tag}`);
  if (name.length < 3 || name.length > 32) redirect(`${withLocale(locale, `/guilds/${tag}`)}?error=name`);
  const { error } = await supabase.rpc("rename_guild", { p_name: name });
  redirect(`${withLocale(locale, `/guilds/${tag}`)}${error ? `?error=${mapError(error)}` : "?renamed=1"}`);
}

/** Besuch für den eigenen Aktivitäts-Kalender zählen (Datenbank zählt höchstens alle 30 Min.). */
export async function recordActivity(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return;
  await supabase.rpc("record_activity", {});
}

// ---------------------------------------------------------------------------
// Gilden-Bild (gleiches System wie das Profilbild)
// ---------------------------------------------------------------------------

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Lädt das Gilden-Bild hoch (nur Anführer): 256×256 WebP im eigenen Ordner unter /guild/. "remove" entfernt es. */
export async function updateGuildImage(_prev: AvatarState, fd: FormData): Promise<AvatarState> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "generic" };
  const folder = `${userId}/guild`;
  const cleanup = async (keep?: string) => {
    const { data: files } = await supabase.storage.from("avatars").list(folder);
    const old = (files ?? []).map((f) => `${folder}/${f.name}`).filter((p) => p !== keep);
    if (old.length) await supabase.storage.from("avatars").remove(old);
  };

  if (fd.get("remove") === "1") {
    const { error } = await supabase.rpc("set_guild_image", { p_url: null });
    if (error) return { error: "generic" };
    await cleanup();
    refresh();
    return { ok: Date.now() };
  }

  const file = fd.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "type" };
  if (file.size > 4 * 1024 * 1024) return { error: "size" };
  if (!IMAGE_TYPES.includes(file.type)) return { error: "type" };
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
  const path = `${folder}/${Date.now()}.webp`;
  const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, { contentType: "image/webp", cacheControl: "31536000" });
  if (upErr) return { error: "generic" };
  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error } = await supabase.rpc("set_guild_image", { p_url: pub.publicUrl });
  if (error) {
    await supabase.storage.from("avatars").remove([path]);
    return { error: "generic" };
  }
  await cleanup(path);
  refresh();
  return { ok: Date.now() };
}

/** Moderation: unpassendes Gilden-Bild entfernen (nur Admins). */
export async function adminClearGuildImage(fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  const tag = String(fd.get("tag") ?? "");
  const supabase = await createClient();
  await supabase.rpc("admin_clear_guild_image", { p_guild: String(fd.get("guild_id") ?? "") });
  redirect(withLocale(locale, `/guilds/${tag}`));
}
