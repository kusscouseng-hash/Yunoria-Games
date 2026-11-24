import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/dictionaries/en";

export type ComingSoonPage = keyof Dictionary["pages"];

/** Kennzeichnet eine Seite klar als noch nicht implementiert (keine Attrappe). */
export async function ComingSoon({ page }: { page: ComingSoonPage }) {
  const { locale, dict } = await getDictionary();
  const text = dict.pages[page];
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Card className="animate-fade-up space-y-4 p-8">
        <Badge tone="warning">{dict.comingSoon.badge}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{text.title}</h1>
        <p className="text-muted">{text.description}</p>
        <p className="text-sm text-subtle">
          {dict.comingSoon.plannedIn} {text.step}
        </p>
        <ButtonLink href={withLocale(locale, "/")} variant="secondary">
          {dict.comingSoon.backHome}
        </ButtonLink>
      </Card>
    </div>
  );
}

/** Seitentitel in der aktuellen Sprache. */
export async function comingSoonMetadata(page: ComingSoonPage): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.pages[page].title };
}
