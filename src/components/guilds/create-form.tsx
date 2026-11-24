"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { createGuild, type GuildFormState } from "@/lib/guilds/actions";
import type { GuildColor } from "@/lib/supabase/database.types";
import { cn } from "@/lib/cn";
import { GuildEmblem, GuildTag, GUILD_COLOR_LIST } from "./guild-tag";

const field = "h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground focus:border-accent focus:outline-none";

export function CreateGuildForm({ locale, t, minLevel }: { locale: string; t: Dictionary["guilds"]; minLevel: number }) {
  const [state, action, pending] = useActionState<GuildFormState, FormData>(createGuild, {});
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [color, setColor] = useState<GuildColor>("red");

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="color" value={color} />

      {/* Vorschau */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/60 p-4">
        <GuildEmblem tag={tag || "TAG"} color={color} size={64} />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{name || t.name}</p>
          <GuildTag tag={tag || "TAG"} color={color} />
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">{t.name}</span>
        <input name="name" required minLength={3} maxLength={32} value={name} onChange={(e) => setName(e.target.value)} className={field} />
        <span className="text-xs text-subtle">{t.nameHint}</span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">{t.tag}</span>
        <input
          name="tag"
          required
          minLength={2}
          maxLength={5}
          pattern="[A-Za-z0-9]{2,5}"
          value={tag}
          onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          className={cn(field, "uppercase tracking-widest")}
        />
        <span className="text-xs text-subtle">{t.tagHint}</span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">{t.descriptionLabel}</span>
        <textarea name="description" maxLength={300} rows={3} className={cn(field, "h-auto py-2")} />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">{t.color}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {GUILD_COLOR_LIST.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-pressed={color === c} aria-label={c} className={cn("rounded-lg p-0.5 ring-2", color === c ? "ring-foreground" : "ring-transparent")}>
              <GuildEmblem color={c} size={32} className="rounded-md" />
            </button>
          ))}
        </div>
      </fieldset>

      <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted">🖼️ {t.imageAfter}</p>

      {state.error && (
        <p role="alert" className="rounded-lg border border-accent/50 bg-accent-soft p-3 text-sm">
          {t.errors[state.error].replace("{level}", String(minLevel))}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-11 w-full rounded-lg bg-accent text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50">
        {pending ? "…" : t.submit}
      </button>
    </form>
  );
}
