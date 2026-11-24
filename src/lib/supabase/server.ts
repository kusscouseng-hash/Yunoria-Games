import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Supabase-Client für Server-Komponenten, Server Actions und Route Handler.
 * Liest die Anmeldung aus den Cookies. Muss innerhalb von <Suspense> verwendet werden,
 * weil er Anfragedaten liest.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // In Server-Komponenten dürfen keine Cookies gesetzt werden.
          // Das ist unkritisch: Der Proxy erneuert die Anmeldung bei jeder Anfrage.
        }
      },
    },
  });
}
