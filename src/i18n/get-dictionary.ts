import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en").then((m) => m.en),
  de: () => import("./dictionaries/de").then((m) => m.de),
};

/** Aktuelle Sprache aus der URL (/en/…, /de/…). Nur in Server-Komponenten nutzbar. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

/** Texte der aktuellen Sprache laden. */
export async function getDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: await dictionaries[locale]() };
}
