import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, TERMS, TERMS_VERSION } from "@/content/terms";
import { withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDictionary();
  return { title: TERMS[locale].title };
}

export default async function TermsPage() {
  const { locale, dict } = await getDictionary();
  const t = TERMS[locale];
  const contact = CONTACT_EMAIL ?? (locale === "de" ? "der Adresse, die wir hier in Kürze veröffentlichen" : "the address we will publish here shortly");
  const withContact = (text: string) => text.replaceAll("{contact}", contact);
  const date = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "long" }).format(new Date(`${TERMS_VERSION}T12:00:00Z`));
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-subtle">
        {t.updated}: {date}
      </p>
      <p className="mt-6 leading-relaxed text-muted">{t.intro}</p>
      <div className="mt-8 space-y-8">
        {t.sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-bold">{s.title}</h2>
            {s.paragraphs.map((p, i) =>
              p.startsWith("• ") ? (
                <ul key={i} className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  {p.split(/\s*•\s*/).filter(Boolean).map((item) => (
                    <li key={item}>{withContact(item.replace(/;$/, ""))}</li>
                  ))}
                </ul>
              ) : (
                <p key={i} className="mt-2 leading-relaxed text-muted">
                  {withContact(p)}
                </p>
              ),
            )}
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm">
        <Link href={withLocale(locale, "/imprint")} className="text-accent-hover hover:underline">
          {dict.nav.imprint}
        </Link>
        {" · "}
        <Link href={withLocale(locale, "/privacy")} className="text-accent-hover hover:underline">
          {dict.nav.privacy}
        </Link>
      </p>
    </article>
  );
}
