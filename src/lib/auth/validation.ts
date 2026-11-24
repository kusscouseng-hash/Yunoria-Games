/** Eingabeprüfung für die Anmeldeformulare (läuft auf dem Server). */

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
export const PASSWORD_MIN_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthErrorKey =
  | "invalidEmail"
  | "invalidUsername"
  | "usernameTaken"
  | "passwordTooShort"
  | "passwordsDontMatch"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "userExists"
  | "weakPassword"
  | "rateLimited"
  | "linkInvalid"
  | "sameBrowser"
  | "termsRequired"
  | "usernameReserved"
  | "googleUnavailable"
  | "generic";

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email) && email.length <= 254;
}

/** Namen, die nach Team/Offiziell klingen – nur Admins dürfen sie tragen (wird auch in der Datenbank geprüft). */
export function isReservedUsername(username: string): boolean {
  return /(admin|owner|moderator|support|official|staff|system)/i.test(username);
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

/** Übersetzt Supabase-Fehlercodes in unsere Textschlüssel. */
export function mapAuthError(code: string | undefined): AuthErrorKey {
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "userExists";
    case "weak_password":
      return "weakPassword";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rateLimited";
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
      return "linkInvalid";
    default:
      return "generic";
  }
}

/** Nur interne Weiterleitungsziele zulassen (Schutz vor Umleitung auf fremde Seiten). */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
