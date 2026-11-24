/**
 * Nutzungsbedingungen (EN/DE).
 * ENTWURF – vor dem kommerziellen Start von einer Anwältin/einem Anwalt prüfen lassen.
 * Bei Änderungen: TERMS_VERSION hochsetzen.
 */
export const TERMS_VERSION = "2026-11-18";

/** Kontakt-E-Mail für Fragen, Meldungen und Urheberrechtsbeschwerden. Sobald vorhanden, hier eintragen. */
export const CONTACT_EMAIL: string | null = null;

export type TermsSection = { title: string; paragraphs: string[] };

export const TERMS: Record<"en" | "de", { title: string; intro: string; updated: string; sections: TermsSection[] }> = {
  en: {
    title: "Terms of Service",
    updated: "Last updated",
    intro:
      "These terms apply to everyone who uses this website. Please read them carefully – by creating an account you agree to them. In short: be respectful, don't do anything illegal, and only read here what is meant to be read here.",
    sections: [
      {
        title: "1. Who we are",
        paragraphs: [
          "This platform is operated from Germany. For questions about these terms, reports and complaints you can reach us by email at {contact}.",
        ],
      },
      {
        title: "2. Who can use the platform",
        paragraphs: [
          "You must be at least 16 years old to create an account. If you are younger, you may only use an account with the consent of a parent or legal guardian.",
          "One account per person. You must give truthful information, keep your password secret and are responsible for everything that happens with your account. Tell us immediately if you think someone else is using it.",
        ],
      },
      {
        title: "3. The content on this platform",
        paragraphs: [
          "We only publish manga, manhwa, manhua and comics for which we have checked the rights – for example works that are in the public domain, released under a suitable license or provided by their creators.",
          "You may read the content for your personal use. You may not download it in bulk, copy it to other websites, sell it or collect it automatically (scraping, bots, crawlers). Licenses and credits are shown on each title's page.",
        ],
      },
      {
        title: "4. Rules for your behaviour",
        paragraphs: [
          "Comments, reactions, usernames, profile pictures and everything else you post must follow the law and these rules. It is forbidden to post or link to:",
          "• illegal content of any kind; • content that sexualises minors in any way (we report this to the authorities); • pornographic or sexually explicit content; • hate speech, discrimination, glorification of violence or extremist content; • insults, harassment, threats, bullying or stalking; • other people's personal data (addresses, phone numbers, photos, etc.); • content that infringes copyrights or trademarks, including links to pirate sites; • spam, advertising, chain messages, scams or malware; • pretending to be another person, a creator or our team.",
          "Please mark spoilers clearly and treat creators and other readers with respect.",
          "It is also forbidden to manipulate XP, levels, ranks, ratings, reactions, view counts or leaderboards – for example with bots, scripts, several accounts or by abusing errors. Please report errors to us instead.",
        ],
      },
      {
        title: "5. Moderation and reports",
        paragraphs: [
          "We may remove content that breaks the law or these rules, and we may restrict, suspend or delete accounts – depending on how serious the violation is, after a warning or immediately. Where possible we tell you why.",
          "You can report illegal content or rule violations to us at any time (by email, see section 1). We check reports quickly and carefully. If you think we made a wrong decision, you can tell us and we will check it again.",
        ],
      },
      {
        title: "6. Rights to what you post",
        paragraphs: [
          "Your comments remain yours. So that we can show them on the platform, you give us a free, non-exclusive right to store, display and technically adapt them (for example for different screen sizes) for as long as they are on the platform. Only post what you are allowed to post.",
        ],
      },
      {
        title: "7. Copyright complaints",
        paragraphs: [
          "If you believe that content on this platform infringes your rights, please contact us (by email, see section 1) with: the affected work, where it appears on our platform, why you are the rights holder or are acting on their behalf, and your contact details. We will check your notice without delay and remove the content if it is unlawful.",
        ],
      },
      {
        title: "8. XP, levels and ranks",
        paragraphs: [
          "XP, levels, ranks and badges are a game feature. They have no monetary value, cannot be sold or transferred and give no right to payment. We may correct them if they were obtained through errors or manipulation, and adjust the system for everyone if it is necessary for balance.",
        ],
      },
      {
        title: "9. Paid features",
        paragraphs: [
          "The platform is currently free. If we offer paid features in the future, separate conditions will apply to them, which we will show you before you buy anything.",
        ],
      },
      {
        title: "10. Availability and changes",
        paragraphs: [
          "We work to keep the platform available, but cannot guarantee that it is always reachable or free of errors. We may change, extend or remove features and content – for example if a license ends.",
        ],
      },
      {
        title: "11. Liability",
        paragraphs: [
          "We are liable without limitation for intent and gross negligence, for injury to life, body or health and under the German Product Liability Act. For slight negligence we are only liable for the breach of essential obligations (obligations that make using the platform possible in the first place), limited to the typical, foreseeable damage. Otherwise our liability is excluded.",
        ],
      },
      {
        title: "12. Ending your account",
        paragraphs: [
          "You can stop using the platform and have your account deleted at any time – just contact us (an automatic delete button will follow). We may end your account with reasonable notice, or immediately for an important reason such as a serious violation of these terms.",
        ],
      },
      {
        title: "13. Changes to these terms",
        paragraphs: [
          "We may update these terms, for example when we add new features or the law changes. We will inform you about important changes in good time. If you do not agree, you can delete your account.",
        ],
      },
      {
        title: "14. Applicable law",
        paragraphs: [
          "German law applies. If you are a consumer, the mandatory consumer protection rules of the country where you live remain unaffected. Privacy is explained in our Privacy Policy.",
        ],
      },
    ],
  },
  de: {
    title: "Nutzungsbedingungen",
    updated: "Stand",
    intro:
      "Diese Bedingungen gelten für alle, die diese Website nutzen. Bitte lies sie aufmerksam – mit der Registrierung stimmst du ihnen zu. Kurz gesagt: Bleib respektvoll, tu nichts Illegales und lies hier nur, was hier zum Lesen gedacht ist.",
    sections: [
      {
        title: "1. Wer wir sind",
        paragraphs: [
          "Diese Plattform wird aus Deutschland betrieben. Bei Fragen zu diesen Bedingungen, für Meldungen und Beschwerden erreichst du uns per E-Mail unter {contact}.",
        ],
      },
      {
        title: "2. Wer die Plattform nutzen darf",
        paragraphs: [
          "Für ein Konto musst du mindestens 16 Jahre alt sein. Wenn du jünger bist, darfst du ein Konto nur mit Zustimmung deiner Eltern oder Erziehungsberechtigten nutzen.",
          "Ein Konto pro Person. Deine Angaben müssen stimmen, dein Passwort hältst du geheim, und du bist für alles verantwortlich, was über dein Konto passiert. Sag uns sofort Bescheid, wenn du glaubst, dass jemand anderes es benutzt.",
        ],
      },
      {
        title: "3. Die Inhalte auf dieser Plattform",
        paragraphs: [
          "Wir veröffentlichen nur Manga, Manhwa, Manhua und Comics, deren Rechte wir geprüft haben – zum Beispiel gemeinfreie Werke, Werke unter passender Lizenz oder Werke, die uns die Urheber zur Verfügung stellen.",
          "Du darfst die Inhalte für dich privat lesen. Du darfst sie nicht massenhaft herunterladen, auf anderen Websites verbreiten, verkaufen oder automatisiert einsammeln (Scraping, Bots, Crawler). Lizenzen und Mitwirkende stehen auf der Seite jedes Titels.",
        ],
      },
      {
        title: "4. Regeln für dein Verhalten",
        paragraphs: [
          "Kommentare, Reaktionen, Benutzernamen, Profilbilder und alles andere, was du veröffentlichst, müssen dem Gesetz und diesen Regeln entsprechen. Verboten ist es, Folgendes zu posten oder zu verlinken:",
          "• rechtswidrige Inhalte jeder Art; • Inhalte, die Minderjährige in irgendeiner Weise sexualisieren (wir melden das den Behörden); • pornografische oder sexuell explizite Inhalte; • Hassrede, Diskriminierung, Gewaltverherrlichung oder extremistische Inhalte; • Beleidigungen, Belästigung, Drohungen, Mobbing oder Stalking; • persönliche Daten anderer (Adressen, Telefonnummern, Fotos usw.); • Inhalte, die Urheber- oder Markenrechte verletzen, auch Links zu Piraterie-Seiten; • Spam, Werbung, Kettenbriefe, Betrug oder Schadsoftware; • dich als eine andere Person, einen Urheber oder unser Team auszugeben.",
          "Bitte kennzeichne Spoiler deutlich und geh respektvoll mit Urhebern und anderen Lesern um.",
          "Ebenso verboten ist es, XP, Level, Ränge, Bewertungen, Reaktionen, Aufrufzahlen oder Ranglisten zu manipulieren – etwa mit Bots, Skripten, mehreren Konten oder durch das Ausnutzen von Fehlern. Melde uns Fehler stattdessen bitte.",
        ],
      },
      {
        title: "5. Moderation und Meldungen",
        paragraphs: [
          "Wir dürfen Inhalte entfernen, die gegen das Gesetz oder diese Regeln verstoßen, und Konten einschränken, sperren oder löschen – je nach Schwere nach einer Verwarnung oder sofort. Wenn möglich, sagen wir dir den Grund.",
          "Du kannst uns rechtswidrige Inhalte oder Regelverstöße jederzeit melden (per E-Mail, siehe Abschnitt 1). Wir prüfen Meldungen zügig und sorgfältig. Wenn du eine Entscheidung von uns für falsch hältst, sag es uns – wir prüfen sie dann erneut.",
        ],
      },
      {
        title: "6. Rechte an deinen Beiträgen",
        paragraphs: [
          "Deine Kommentare bleiben deine. Damit wir sie auf der Plattform zeigen können, räumst du uns ein kostenloses, nicht exklusives Recht ein, sie zu speichern, anzuzeigen und technisch anzupassen (zum Beispiel für verschiedene Bildschirmgrößen), solange sie auf der Plattform sind. Poste nur, was du posten darfst.",
        ],
      },
      {
        title: "7. Urheberrechtsbeschwerden",
        paragraphs: [
          "Wenn du glaubst, dass ein Inhalt auf dieser Plattform deine Rechte verletzt, schreib uns bitte (per E-Mail, siehe Abschnitt 1) mit: dem betroffenen Werk, wo es bei uns zu finden ist, warum du Rechteinhaber bist oder in dessen Auftrag handelst, und deinen Kontaktdaten. Wir prüfen deine Meldung unverzüglich und entfernen den Inhalt, wenn er rechtswidrig ist.",
        ],
      },
      {
        title: "8. XP, Level und Ränge",
        paragraphs: [
          "XP, Level, Ränge und Abzeichen sind eine Spielfunktion. Sie haben keinen Geldwert, können nicht verkauft oder übertragen werden und begründen keinen Anspruch auf Auszahlung. Wir dürfen sie korrigieren, wenn sie durch Fehler oder Manipulation entstanden sind, und das System für alle anpassen, wenn es für die Balance nötig ist.",
        ],
      },
      {
        title: "9. Kostenpflichtige Funktionen",
        paragraphs: [
          "Die Plattform ist derzeit kostenlos. Falls wir später kostenpflichtige Funktionen anbieten, gelten dafür eigene Bedingungen, die wir dir vor einem Kauf anzeigen.",
        ],
      },
      {
        title: "10. Verfügbarkeit und Änderungen",
        paragraphs: [
          "Wir bemühen uns, dass die Plattform erreichbar ist, können aber nicht garantieren, dass sie immer verfügbar oder fehlerfrei ist. Wir dürfen Funktionen und Inhalte ändern, erweitern oder entfernen – zum Beispiel, wenn eine Lizenz endet.",
        ],
      },
      {
        title: "11. Haftung",
        paragraphs: [
          "Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz. Bei leichter Fahrlässigkeit haften wir nur für die Verletzung wesentlicher Pflichten (Pflichten, die die Nutzung der Plattform überhaupt erst ermöglichen), begrenzt auf den typischen, vorhersehbaren Schaden. Im Übrigen ist die Haftung ausgeschlossen.",
        ],
      },
      {
        title: "12. Konto beenden",
        paragraphs: [
          "Du kannst die Nutzung jederzeit beenden und dein Konto löschen lassen – schreib uns einfach (ein automatischer Lösch-Knopf folgt). Wir dürfen dein Konto mit angemessener Frist kündigen, oder sofort aus wichtigem Grund, etwa bei einem schweren Verstoß gegen diese Bedingungen.",
        ],
      },
      {
        title: "13. Änderungen dieser Bedingungen",
        paragraphs: [
          "Wir dürfen diese Bedingungen anpassen, zum Beispiel bei neuen Funktionen oder geänderten Gesetzen. Über wichtige Änderungen informieren wir dich rechtzeitig. Wenn du nicht einverstanden bist, kannst du dein Konto löschen.",
        ],
      },
      {
        title: "14. Anwendbares Recht",
        paragraphs: [
          "Es gilt deutsches Recht. Wenn du Verbraucher bist, bleiben die zwingenden Verbraucherschutzvorschriften deines Wohnsitzlandes unberührt. Wie wir mit deinen Daten umgehen, steht in der Datenschutzerklärung.",
        ],
      },
    ],
  },
};
