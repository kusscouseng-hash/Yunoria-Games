import { redirect } from "next/navigation";
import { withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/** Alte Adresse „Mehr Spiele“ → jetzt die Sammlung „Beliebt“. */
export default async function ArcadeRedirect() {
  const { locale } = await getDictionary();
  redirect(withLocale(locale, "/c/popular"));
}
