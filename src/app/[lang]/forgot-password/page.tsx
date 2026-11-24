import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.forgot.title };
}

export default async function ForgotPasswordPage() {
  const { locale, dict } = await getDictionary();
  return (
    <AuthCard title={dict.auth.forgot.title} subtitle={dict.auth.forgot.subtitle}>
      <ForgotPasswordForm t={dict.auth} locale={locale} />
    </AuthCard>
  );
}
