import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.register.title };
}

export default async function RegisterPage() {
  const { locale, dict } = await getDictionary();
  return (
    <AuthCard title={dict.auth.register.title} subtitle={dict.auth.register.subtitle}>
      <RegisterForm t={dict.auth} locale={locale} />
    </AuthCard>
  );
}
