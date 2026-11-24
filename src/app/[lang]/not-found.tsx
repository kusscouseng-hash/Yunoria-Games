import { ButtonLink } from "@/components/ui/button";
import { withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function NotFound() {
  const { locale, dict } = await getDictionary();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="text-3xl font-bold tracking-tight">{dict.notFound.title}</h1>
      <p className="text-muted">{dict.notFound.description}</p>
      <ButtonLink href={withLocale(locale, "/")} variant="secondary">
        {dict.comingSoon.backHome}
      </ButtonLink>
    </div>
  );
}
