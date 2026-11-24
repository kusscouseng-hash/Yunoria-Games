import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import type { AuthErrorKey } from "@/lib/auth/validation";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.login.submit };
}

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/login">) {
  const { locale, dict } = await getDictionary();
  return (
    <AuthCard title={dict.auth.login.title} subtitle={dict.auth.login.subtitle}>
      <Suspense fallback={<LoginForm t={dict.auth} locale={locale} />}>
        <LoginFormWithParams t={dict.auth} locale={locale} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginFormWithParams({
  t,
  locale,
  searchParams,
}: {
  t: Dictionary["auth"];
  locale: Locale;
  searchParams: PageProps<"/[lang]/login">["searchParams"];
}) {
  // Bereits angemeldet? Dann direkt zum Konto.
  if (await getCurrentUser()) redirect(withLocale(locale, "/account"));

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const allowed: AuthErrorKey[] = ["linkInvalid", "sameBrowser", "googleUnavailable"];
  const error = allowed.find((key) => key === params.error);
  return <LoginForm t={t} locale={locale} next={next} initialError={error} confirmed={params.confirmed === "1"} />;
}
