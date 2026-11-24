import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard, FormMessage } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { ButtonLink } from "@/components/ui/button";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.reset.title };
}

export default async function ResetPasswordPage() {
  const { locale, dict } = await getDictionary();
  return (
    <AuthCard title={dict.auth.reset.title} subtitle={dict.auth.reset.subtitle}>
      <Suspense fallback={<p className="text-sm text-muted">{dict.auth.pending}</p>}>
        <ResetContent t={dict.auth} locale={locale} />
      </Suspense>
    </AuthCard>
  );
}

/** Nur wer über den E-Mail-Link kommt (und damit angemeldet ist), darf ein neues Passwort setzen. */
async function ResetContent({ t, locale }: { t: Dictionary["auth"]; locale: Locale }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-4">
        <FormMessage tone="error">{t.reset.notSignedIn}</FormMessage>
        <ButtonLink href={withLocale(locale, "/forgot-password")} variant="secondary" className="w-full">
          {t.reset.requestNew}
        </ButtonLink>
      </div>
    );
  }
  return <ResetPasswordForm t={t} locale={locale} />;
}
