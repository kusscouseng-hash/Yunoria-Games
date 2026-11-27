"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/config";
import {
  requestPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
  type AuthFormState,
} from "@/lib/auth/actions";
import { PASSWORD_MIN_LENGTH, isReservedUsername, isValidEmail, isValidUsername, type AuthErrorKey } from "@/lib/auth/validation";
import { FormMessage } from "./auth-card";

type T = Dictionary["auth"];
type Common = { t: T; locale: Locale };

const initial: AuthFormState = {};

/** Fehlerkasten oben im Formular – scrollt bei einem neuen Fehler ins Bild, damit man ihn sicher sieht. */
function ErrorBox({ t, error }: { t: T; error?: AuthErrorKey }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);
  return error ? (
    <div ref={ref} role="alert">
      <FormMessage tone="error">{t.errors[error]}</FormMessage>
    </div>
  ) : null;
}

type Field = "username" | "email" | "password" | "confirm" | "terms";

/** Fehler, die direkt beim Tippen geprüft werden (die Prüfung auf dem Server bleibt zusätzlich). */
function checkFields(v: { username?: string; email: string; password: string; confirm?: string; terms?: boolean }, mode: "register" | "login" | "reset") {
  const e: Partial<Record<Field, AuthErrorKey>> = {};
  if (mode === "register") {
    const u = v.username ?? "";
    if (!isValidUsername(u)) e.username = "invalidUsername";
    else if (isReservedUsername(u)) e.username = "usernameReserved";
  }
  if (mode !== "reset" && !isValidEmail(v.email.trim())) e.email = "invalidEmail";
  if (mode === "login") {
    if (!v.password) e.password = "passwordTooShort";
  } else {
    if (v.password.length < PASSWORD_MIN_LENGTH) e.password = "passwordTooShort";
    if (v.confirm !== v.password) e.confirm = "passwordsDontMatch";
  }
  if (mode === "register" && !v.terms) e.terms = "termsRequired";
  return e;
}

/** Vom Server gemeldeter Fehler → zu welchem Feld gehört er? */
function serverField(error?: AuthErrorKey): Field | null {
  switch (error) {
    case "invalidUsername":
    case "usernameTaken":
    case "usernameReserved":
      return "username";
    case "invalidEmail":
    case "userExists":
      return "email";
    case "passwordTooShort":
    case "weakPassword":
      return "password";
    case "passwordsDontMatch":
      return "confirm";
    case "termsRequired":
      return "terms";
    default:
      return null;
  }
}

/** Zustand für Live-Prüfung: Felder zeigen Fehler, sobald man sie verlassen oder auf Absenden gedrückt hat. */
function useLiveCheck(errors: Partial<Record<Field, AuthErrorKey>>) {
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const show = (f: Field) => (submitted || touched[f] ? errors[f] : undefined);
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));
  /** Beim Absenden: bei Fehlern nicht abschicken, zum ersten fehlerhaften Feld springen */
  const onSubmit = (e: FormEvent<HTMLFormElement>, order: Field[]) => {
    setSubmitted(true);
    const first = order.find((f) => errors[f]);
    if (!first) return;
    e.preventDefault();
    const el = e.currentTarget.elements.namedItem(first);
    if (el instanceof HTMLElement) {
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
  return { show, blur, onSubmit };
}

function Submit({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}

// ---------------------------------------------------------------------
/** "Weiter mit Google" + Trennlinie. Eigenes Formular (darf nicht im E-Mail-Formular stecken). */
export function GoogleButton({ t, locale, next }: Common & { next?: string }) {
  return (
    <div className="space-y-3">
      <form action={signInWithGoogle} data-google="">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
        >
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
            />
          </svg>
          {t.register.google}
        </button>
      </form>
      <p className="text-center text-xs text-subtle">
        {t.register.googleConsent.split(t.register.acceptTermsLink)[0]}
        <Link
          href={withLocale(locale, "/terms")}
          target="_blank"
          className="underline hover:text-foreground"
        >
          {t.register.acceptTermsLink}
        </Link>
        {t.register.googleConsent.split(t.register.acceptTermsLink)[1] ?? ""}
      </p>
      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-subtle">
        <span className="h-px flex-1 bg-border" />
        {t.register.or}
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
export function LoginForm({
  t,
  locale,
  next,
  initialError,
  confirmed,
}: Common & {
  next?: string;
  initialError?: AuthErrorKey;
  confirmed?: boolean;
}) {
  const [state, action, pending] = useActionState(signIn, {
    error: initialError,
  });
  const [email, setEmail] = useState(state.values?.email ?? "");
  const [password, setPassword] = useState("");
  const errors = checkFields({ email, password }, "login");
  const live = useLiveCheck(errors);
  return (
    <>
      <GoogleButton t={t} locale={locale} next={next} />
      <form action={action} onSubmit={(e) => live.onSubmit(e, ["email", "password"])} className="mt-4 space-y-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        {confirmed && !state.error && (
          <FormMessage tone="success">{t.login.confirmed}</FormMessage>
        )}
        <ErrorBox t={t} error={state.error} />
        <Input
          label={t.fields.email}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={live.blur("email")}
          error={live.show("email") && t.errors[live.show("email")!]}
        />
        <PasswordInput
          showLabel={t.fields.showPassword}
          hideLabel={t.fields.hidePassword}
          label={t.fields.password}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={live.blur("password")}
          error={live.show("password") && t.fields.passwordRequired}
        />
        <div className="flex justify-end">
          <Link
            href={withLocale(locale, "/forgot-password")}
            className="text-sm text-muted hover:text-foreground"
          >
            {t.login.forgot}
          </Link>
        </div>
        <Submit
          pending={pending}
          label={t.login.submit}
          pendingLabel={t.pending}
        />
        <p className="text-center text-sm text-muted">
          {t.login.noAccount}{" "}
          <Link
            href={withLocale(locale, "/register")}
            className="font-semibold text-accent-hover hover:underline"
          >
            {t.login.toRegister}
          </Link>
        </p>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------
export function RegisterForm({ t, locale }: Common) {
  const [state, action, pending] = useActionState(signUp, initial);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const errors = checkFields({ username, email, password, confirm, terms }, "register");
  const live = useLiveCheck(errors);
  // Vom Server gemeldete Fehler (z. B. Name vergeben) am passenden Feld zeigen, bis man dort etwas ändert
  const [serverErr, setServerErr] = useState<{ field: Field; error: AuthErrorKey } | null>(null);
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    const f = serverField(state.error);
    setServerErr(f && state.error ? { field: f, error: state.error } : null);
  }
  const fieldError = (f: Field) => {
    const k = live.show(f) ?? (serverErr?.field === f ? serverErr.error : undefined);
    return k ? t.errors[k] : undefined;
  };
  const edit = (f: Field, set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    if (serverErr?.field === f) setServerErr(null);
  };
  if (state.success) {
    return (
      <div className="space-y-4">
        <FormMessage tone="success">
          <strong className="block">{t.register.successTitle}</strong>
          {t.register.successText}
        </FormMessage>
        <Link
          href={withLocale(locale, "/login")}
          className="block text-center text-sm font-semibold text-accent-hover hover:underline"
        >
          {t.register.toLogin}
        </Link>
      </div>
    );
  }
  return (
    <>
      <GoogleButton t={t} locale={locale} />
      <form
        action={action}
        onSubmit={(e) => live.onSubmit(e, ["username", "email", "password", "confirm", "terms"])}
        className="mt-4 space-y-4"
        noValidate
      >
        <input type="hidden" name="locale" value={locale} />
        {/* Fehler ohne eigenes Feld (z. B. zu viele Versuche) oben anzeigen */}
        <ErrorBox t={t} error={serverField(state.error) ? undefined : state.error} />
        <Input
          label={t.fields.username}
          hint={t.fields.usernameHint}
          name="username"
          autoComplete="username"
          required
          maxLength={20}
          value={username}
          onChange={edit("username", setUsername)}
          onBlur={live.blur("username")}
          error={fieldError("username")}
        />
        <Input
          label={t.fields.email}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={edit("email", setEmail)}
          onBlur={live.blur("email")}
          error={fieldError("email")}
        />
        <PasswordInput
          showLabel={t.fields.showPassword}
          hideLabel={t.fields.hidePassword}
          label={t.fields.password}
          hint={
            password.length > 0 && password.length < PASSWORD_MIN_LENGTH
              ? t.fields.passwordCount.replace("{n}", String(password.length)).replace("{min}", String(PASSWORD_MIN_LENGTH))
              : t.fields.passwordHint
          }
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={edit("password", setPassword)}
          onBlur={live.blur("password")}
          error={fieldError("password")}
        />
        <PasswordInput
          showLabel={t.fields.showPassword}
          hideLabel={t.fields.hidePassword}
          label={t.fields.confirmPasswordSignup}
          name="confirm"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={edit("confirm", setConfirm)}
          onBlur={live.blur("confirm")}
          error={fieldError("confirm")}
        />
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            name="terms"
            required
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked);
              if (serverErr?.field === "terms") setServerErr(null);
            }}
            aria-invalid={fieldError("terms") ? true : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
          />
          <span>
            {t.register.acceptTermsBefore}{" "}
            <Link
              href={withLocale(locale, "/terms")}
              target="_blank"
              className="font-semibold text-accent-hover underline"
            >
              {t.register.acceptTermsLink}
            </Link>{" "}
            {t.register.acceptTermsAfter}
          </span>
        </label>
        {fieldError("terms") && (
          <p className="-mt-2 flex items-start gap-1.5 text-xs font-semibold text-red-300">
            <span aria-hidden="true">⚠</span>
            {fieldError("terms")}
          </p>
        )}
        <p className="text-xs text-subtle">{t.register.terms}</p>
        <Submit
          pending={pending}
          label={t.register.submit}
          pendingLabel={t.pending}
        />
        <p className="text-center text-sm text-muted">
          {t.register.haveAccount}{" "}
          <Link
            href={withLocale(locale, "/login")}
            className="font-semibold text-accent-hover hover:underline"
          >
            {t.register.toLogin}
          </Link>
        </p>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------
export function ForgotPasswordForm({ t, locale }: Common) {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initial,
  );
  const back = (
    <Link
      href={withLocale(locale, "/login")}
      className="block text-center text-sm text-muted hover:text-foreground"
    >
      {t.forgot.back}
    </Link>
  );
  if (state.success) {
    return (
      <div className="space-y-4">
        <FormMessage tone="success">
          <strong className="block">{t.forgot.successTitle}</strong>
          {t.forgot.successText}
        </FormMessage>
        {back}
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <ErrorBox t={t} error={state.error} />
      <Input
        label={t.fields.email}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
      />
      <Submit
        pending={pending}
        label={t.forgot.submit}
        pendingLabel={t.pending}
      />
      {back}
    </form>
  );
}

// ---------------------------------------------------------------------
export function ResetPasswordForm({ t, locale }: Common) {
  const [state, action, pending] = useActionState(updatePassword, initial);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const errors = checkFields({ email: "", password, confirm }, "reset");
  const live = useLiveCheck(errors);
  return (
    <form action={action} onSubmit={(e) => live.onSubmit(e, ["password", "confirm"])} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <ErrorBox t={t} error={state.error} />
      <PasswordInput
        showLabel={t.fields.showPassword}
        hideLabel={t.fields.hidePassword}
        label={t.fields.newPassword}
        hint={t.fields.passwordHint}
        name="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={live.blur("password")}
        error={live.show("password") && t.errors[live.show("password")!]}
      />
      <PasswordInput
        showLabel={t.fields.showPassword}
        hideLabel={t.fields.hidePassword}
        label={t.fields.confirmPassword}
        name="confirm"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onBlur={live.blur("confirm")}
        error={live.show("confirm") && t.errors[live.show("confirm")!]}
      />
      <Submit
        pending={pending}
        label={t.reset.submit}
        pendingLabel={t.pending}
      />
    </form>
  );
}
