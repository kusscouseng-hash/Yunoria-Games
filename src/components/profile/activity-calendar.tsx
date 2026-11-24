import { Card } from "@/components/ui/card";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";

/**
 * Eigener Aktivitäts-Kalender (nur für einen selbst): jeder Kasten = ein Tag,
 * Farbe = gelesene Kapitel. Besuche und Kapitel stehen im Tooltip.
 */
const RANGES = [3, 6, 12] as const;
export type ActivityRange = (typeof RANGES)[number];

const berlinToday = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function ActivityCalendar({ t, locale, months, baseHref }: { t: Dictionary["activity"]; locale: string; months: ActivityRange; baseHref: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_activity", { p_days: 372 });
  if (error) return null; // Migration 16 fehlt noch

  const byDay = new Map((data ?? []).map((r) => [String(r.day).slice(0, 10), r]));
  const today = berlinToday();
  today.setHours(0, 0, 0, 0);

  // Start: Montag der Woche vor `months` Monaten
  const start = new Date(today);
  start.setMonth(start.getMonth() - months);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const weeks: Array<Array<{ key: string; date: Date; visits: number; chapters: number; future: boolean }>> = [];
  for (const d = new Date(start); d <= today || weeks[weeks.length - 1]?.length !== 7; d.setDate(d.getDate() + 1)) {
    if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) weeks.push([]);
    const key = iso(d);
    const r = byDay.get(key);
    weeks[weeks.length - 1].push({ key, date: new Date(d), visits: r?.visits ?? 0, chapters: r?.chapters ?? 0, future: d > today });
    if (weeks.length > 60) break;
  }

  // Kennzahlen (ganzer Zeitraum, den die Datenbank liefert)
  const all = [...byDay.values()];
  const activeDays = all.filter((r) => r.visits > 0 || r.chapters > 0).length;
  const chapters = all.reduce((s, r) => s + r.chapters, 0);
  const visits = all.reduce((s, r) => s + r.visits, 0);
  let streak = 0;
  for (const d = new Date(today); ; d.setDate(d.getDate() - 1)) {
    const r = byDay.get(iso(d));
    if (r && (r.visits > 0 || r.chapters > 0)) streak++;
    else if (iso(d) !== iso(today)) break; // heute darf noch fehlen
    if (streak > 400) break;
  }
  let best = 0;
  let run = 0;
  for (let d = new Date(today), i = 0; i < 372; d.setDate(d.getDate() - 1), i++) {
    const r = byDay.get(iso(d));
    run = r && (r.visits > 0 || r.chapters > 0) ? run + 1 : 0;
    best = Math.max(best, run);
  }

  const level = (c: { visits: number; chapters: number }) =>
    c.chapters >= 10 ? 4 : c.chapters >= 5 ? 3 : c.chapters >= 2 ? 2 : c.chapters >= 1 ? 1 : c.visits > 0 ? 0.5 : 0;
  const shade = (l: number) =>
    l === 4 ? "bg-accent" : l === 3 ? "bg-accent/75" : l === 2 ? "bg-accent/50" : l === 1 ? "bg-accent/30" : l === 0.5 ? "bg-surface-3 ring-1 ring-inset ring-accent/30" : "bg-surface-2";
  const monthFmt = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { month: "short" });
  const dayFmt = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { dateStyle: "medium" });
  const nf = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US");

  const stats = [
    { icon: "📖", value: nf.format(chapters), label: t.chapters },
    { icon: "🔥", value: `${streak}`, label: t.streak },
    { icon: "🏅", value: `${best}`, label: t.bestStreak },
    { icon: "📅", value: nf.format(activeDays), label: t.activeDays },
  ];

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{t.title}</h2>
          <p className="text-xs text-subtle">🔒 {t.private}</p>
        </div>
        <nav className="flex rounded-lg border border-border p-0.5" aria-label={t.range}>
          {RANGES.map((m) => (
            <a
              key={m}
              href={`${baseHref}${baseHref.includes("?") ? "&" : "?"}activity=${m}#activity`}
              aria-current={m === months ? "page" : undefined}
              className={cn("rounded-md px-3 py-1 text-xs font-semibold", m === months ? "bg-surface-3 text-foreground" : "text-subtle hover:text-foreground")}
            >
              {t.months.replace("{n}", String(m))}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface-2/60 p-3">
            <p className="text-lg font-black tabular-nums">
              <span aria-hidden="true">{s.icon}</span> {s.value}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto pb-1" id="activity">
        <div className="inline-flex min-w-full flex-col gap-1">
          {/* Monatsnamen */}
          <div className="flex gap-[3px] pl-0 text-[10px] text-subtle">
            {weeks.map((w, i) => {
              const show = i === 0 || w[0].date.getMonth() !== weeks[i - 1][0].date.getMonth();
              return (
                <span key={i} className="w-3 shrink-0 overflow-visible whitespace-nowrap sm:w-3.5">
                  {show ? monthFmt.format(w[0].date) : ""}
                </span>
              );
            })}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((w, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {w.map((d) => (
                  <span
                    key={d.key}
                    title={d.future ? "" : `${dayFmt.format(d.date)}: ${t.tooltip.replace("{c}", String(d.chapters)).replace("{v}", String(d.visits))}`}
                    className={cn("h-3 w-3 rounded-[3px] sm:h-3.5 sm:w-3.5", d.future ? "opacity-0" : shade(level(d)))}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-subtle">
        <span>{t.visits.replace("{n}", nf.format(visits))}</span>
        <span className="flex items-center gap-1">
          {t.less}
          {[0, 0.5, 1, 2, 3, 4].map((l) => (
            <span key={l} className={cn("h-3 w-3 rounded-[3px]", shade(l))} />
          ))}
          {t.more}
        </span>
      </div>
    </Card>
  );
}
