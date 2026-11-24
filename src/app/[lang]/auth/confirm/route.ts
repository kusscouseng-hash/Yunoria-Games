import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { defaultLocale, hasLocale, withLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/validation";

/**
 * Ziel der Links aus Bestätigungs- und Passwort-E-Mails.
 * Tauscht den Code aus der E-Mail gegen eine Anmeldung und leitet weiter.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/[lang]/auth/confirm">) {
  const { lang } = await ctx.params;
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const { searchParams, origin } = request.nextUrl;

  const next = safeNextPath(searchParams.get("next"), withLocale(locale, "/account"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const login = withLocale(locale, "/login");
  const go = (target: string) => NextResponse.redirect(new URL(target, origin));

  // Supabase hängt bei abgelaufenen/benutzten Links error_code an (z. B. otp_expired)
  if (searchParams.get("error_code") || searchParams.get("error")) return go(`${login}?error=linkInvalid`);

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    return go(error ? `${login}?error=linkInvalid` : next);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return go(next);

    // Link wurde in einem anderen Browser/Gerät geöffnet als dem, in dem man sich registriert hat.
    // Supabase hat die E-Mail zu diesem Zeitpunkt bereits bestätigt – nur die automatische
    // Anmeldung ist so nicht möglich. Bei einem Passwort-Reset muss derselbe Browser genutzt werden.
    if (error.code === "pkce_code_verifier_not_found") {
      const isReset = next.endsWith("/reset-password");
      return go(isReset ? `${login}?error=sameBrowser` : `${login}?confirmed=1`);
    }
  }

  return go(`${login}?error=linkInvalid`);
}
