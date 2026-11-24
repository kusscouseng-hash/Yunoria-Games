"use client";

import { useActionState } from "react";
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
import type { AuthErrorKey } from "@/lib/auth/validation";
import { FormMessage } from "./auth-card";

type T = Dictionary["auth"];
type Common = { t: T; locale: Locale };

const initial: AuthFormState = {};

function ErrorBox({ t, error }: { t: T; error?: AuthErrorKey }) {
  return error ? (
    <FormMessage tone="error">{t.errors[error]}</FormMessage>
  ) : null;
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
  return (
    <>
      <GoogleButton t={t} locale={locale} next={next} />
      <form action={action} className="mt-4 space-y-4" noValidate>
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
          defaultValue={state.values?.email}
        />
        <PasswordInput
          showLabel={t.fields.showPassword}
          hideLabel={t.fields.hidePassword}
          label={t.fields.password}
          name="password"
          autoComplete="current-password"
          required
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
      <form action={action} className="mt-4 space-y-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <ErrorBox t={t} error={state.error} />
        <Input
          label={t.fields.username}
          hint={t.fields.usernameHint}
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9_]{3,20}"
          defaultValue={state.values?.username}
        />
        <Input
          label={t.fields.email}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
        />
        <PasswordInput
          showLabel={t.fields.showPassword}
          hideLabel={t.fields.hidePassword}
          label={t.fields.password}
          hint={t.fields.passwordHint}
          name="password"

          autoComplete="new-password"
          required
          minLength={8}
        />
        <PasswordInput
          showLabel={t.fields.showPassword}
          hideLabel={t.fields.hidePassword}
          label={t.fields.confirmPasswordSignup}
          name="confirm"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            name="terms"
            required
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
  return (
    <form action={action} className="space-y-4" noValidate>
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
        minLength={8}
      />
      <PasswordInput
        showLabel={t.fields.showPassword}
        hideLabel={t.fields.hidePassword}
        label={t.fields.confirmPassword}
        name="confirm"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <Submit
        pending={pending}
        label={t.reset.submit}
        pendingLabel={t.pending}
      />
    </form>
  );
}
