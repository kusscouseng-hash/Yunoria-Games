"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { updateBio, type BioState } from "@/lib/profile/actions";

export function BioForm({ bio, t }: { bio: string | null; t: Dictionary["profile"] }) {
  const [state, action, pending] = useActionState<BioState, FormData>(updateBio, {});
  return (
    <form action={action} className="space-y-2">
      <textarea
        name="bio"
        defaultValue={bio ?? ""}
        maxLength={300}
        rows={3}
        placeholder={t.bioPlaceholder}
        aria-label={t.bio}
        className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-subtle">{t.bioHint}</p>
        <div className="flex items-center gap-3">
          {state.ok && <span className="text-xs text-success">{t.bioSaved}</span>}
          <button type="submit" disabled={pending} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60">
            {t.bioSave}
          </button>
        </div>
      </div>
    </form>
  );
}
