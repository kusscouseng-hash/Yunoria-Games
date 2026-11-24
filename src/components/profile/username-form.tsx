"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { updateUsername, type UsernameState } from "@/lib/profile/actions";

export function UsernameForm({ current, t }: { current: string; t: Dictionary["auth"]["account"] }) {
  const [state, action, pending] = useActionState<UsernameState, FormData>(updateUsername, {});
  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          name="username"
          defaultValue={state.ok ?? current}
          required
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9_]{3,20}"
          aria-label={t.changeName}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {t.changeNameSave}
        </button>
      </div>
      <p className="text-xs text-subtle">{t.changeNameHint}</p>
      {state.error && <p role="alert" className="text-sm text-accent-hover">{t.changeNameErrors[state.error]}</p>}
      {state.ok && <p className="text-sm text-success">{t.changeNameSaved.replace("{name}", state.ok)}</p>}
    </form>
  );
}
