import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Supabase-Client OHNE Anmeldung – nur für öffentliche Daten (veröffentlichte Werke, Genres).
 * Liest keine Cookies und kann deshalb in zwischengespeicherten Funktionen ("use cache") laufen.
 */
export function createPublicClient() {
  const { url, key } = getSupabaseEnv();
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Öffentliche Adresse eines Covers im Speicher-Bucket "covers". */
export function coverUrl(path: string | null): string | null {
  if (!path) return null;
  // Eigene, mitgelieferte Cover (z. B. Roman-Klassiker) liegen direkt auf der Website
  if (path.startsWith("/")) return path;
  const { url } = getSupabaseEnv();
  return `${url}/storage/v1/object/public/covers/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Öffentliche Adresse einer Kapitelseite. Einzige Stelle, die beim Umzug zu Cloudflare R2
 * angepasst werden muss (dann z. B. auf eine eigene Bild-Domain zeigen).
 */
export function pageUrl(path: string): string {
  const { url } = getSupabaseEnv();
  return `${url}/storage/v1/object/public/chapters/${path.split("/").map(encodeURIComponent).join("/")}`;
}
