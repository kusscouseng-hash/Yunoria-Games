"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, hasLocale, withLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import {
  isValidEmail,
  isReservedUsername,
  isValidUsername,
  mapAuthError,
  PASSWORD_MIN_LENGTH,
  safeNextPath,
  type AuthErrorKey,
} from "./validation";

export type AuthFormState = {
  error?: AuthErrorKey;
  success?: boolean;
  values?: { email?: string; username?: string };
};

function readLocale(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return hasLocale(value) ? value : defaultLocale;
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** Basis-Adresse der Seite (lokal oder online) für Links in E-Mails. */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------------
// Anmelden
// ---------------------------------------------------------------------
export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const locale = readLocale(formData);
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(text(formData, "next"), withLocale(locale, "/account"));

  if (!isValidEmail(email)) return { error: "invalidEmail", values: { email } };
  if (!password) return { error: "invalidCredentials", values: { email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: mapAuthError(error.code), values: { email } };

  redirect(next);
}

// ---------------------------------------------------------------------
// Registrieren
// ---------------------------------------------------------------------
export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const locale = readLocale(formData);
  const username = text(formData, "username");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const values = { email, username };

  if (!isValidUsername(username)) return { error: "invalidUsername", values };
  if (isReservedUsername(username)) return { error: "usernameReserved", values };
  if (!isValidEmail(email)) return { error: "invalidEmail", values };
  if (password.length < PASSWORD_MIN_LENGTH) return { error: "passwordTooShort", values };
  if (password !== confirm) return { error: "passwordsDontMatch", values };
  if (formData.get("terms") !== "on") return { error: "termsRequired", values };

  const supabase = await createClient();

  const { data: available, error: rpcError } = await supabase.rpc("username_available", { name: username });
  if (rpcError) return { error: "generic", values };
  if (!available) return { error: "usernameTaken", values };

  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, locale, terms_accepted: "true" },
      emailRedirectTo: `${origin}${withLocale(locale, "/auth/confirm")}?next=${encodeURIComponent(withLocale(locale, "/account"))}`,
    },
  });
  if (error) return { error: mapAuthError(error.code), values };

  // Ist in Supabase „E-Mail bestätigen“ ausgeschaltet, gibt es sofort eine Sitzung → direkt angemeldet weiter
  if (data.session) redirect(withLocale(locale, "/"));

  // Aus Datenschutzgründen verrät Supabase nicht, ob die E-Mail schon registriert ist.
  // Wir zeigen deshalb immer denselben Hinweis: "Bitte E-Mail bestätigen".
  return { success: true, values };
}

// ---------------------------------------------------------------------
// Passwort vergessen
// ---------------------------------------------------------------------
export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const locale = readLocale(formData);
  const email = text(formData, "email").toLowerCase();
  if (!isValidEmail(email)) return { error: "invalidEmail", values: { email } };

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}${withLocale(locale, "/auth/confirm")}?next=${encodeURIComponent(withLocale(locale, "/reset-password"))}`,
  });
  if (error && mapAuthError(error.code) === "rateLimited") return { error: "rateLimited", values: { email } };

  // Immer Erfolg melden – verrät nicht, ob ein Konto existiert.
  return { success: true, values: { email } };
}

// ---------------------------------------------------------------------
// Neues Passwort setzen (nach Klick auf den Link in der E-Mail)
// ---------------------------------------------------------------------
export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const locale = readLocale(formData);
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < PASSWORD_MIN_LENGTH) return { error: "passwordTooShort" };
  if (password !== confirm) return { error: "passwordsDontMatch" };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { error: "linkInvalid" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: mapAuthError(error.code) };

  redirect(withLocale(locale, "/account"));
}

// ---------------------------------------------------------------------
// Abmelden
// ---------------------------------------------------------------------
export async function signOut(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(withLocale(locale, "/"));
}

// ---------------------------------------------------------------------
// Weiter mit Google
// ---------------------------------------------------------------------
/** Ist Google in Supabase eingeschaltet? (öffentliche Einstellungen des Auth-Servers) */
async function googleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { external?: { google?: boolean } };
    return Boolean(json.external?.google);
  } catch {
    return false;
  }
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  const next = safeNextPath(text(formData, "next"), withLocale(locale, "/account"));
  const login = withLocale(locale, "/login");
  if (!(await googleEnabled())) redirect(`${login}?error=googleUnavailable`);

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}${withLocale(locale, "/auth/confirm")}?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`${login}?error=googleUnavailable`);
  redirect(data.url);
}
