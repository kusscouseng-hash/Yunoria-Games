import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasLocale, LOCALE_COOKIE, matchLocale, withLocale } from "@/i18n/config";

/**
 * Läuft vor jeder Seitenanfrage:
 * 1. Adressen ohne Sprachpräfix → passende Sprache (Cookie → Browser → Englisch).
 * 2. Anmeldung (Supabase-Sitzung) bei Bedarf erneuern, damit Nutzer eingeloggt bleiben.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (!first || !hasLocale(first)) {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = saved && hasLocale(saved) ? saved : matchLocale(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = withLocale(locale, pathname);
    return NextResponse.redirect(url);
  }

  return refreshSession(request);
}

async function refreshSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // Prüft das Anmelde-Token und erneuert es, wenn es bald abläuft.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Nicht für interne Next.js-Dateien, API-Routen und Dateien mit Endung (z. B. favicon.ico)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
