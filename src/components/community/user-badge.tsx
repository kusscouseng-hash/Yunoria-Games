import type { Dictionary } from "@/i18n/dictionaries/en";

/** Abzeichen neben dem Namen: Owner (Inhaber, gold) oder Team-Rolle. */
export function UserBadge({ isOwner, role, t }: { isOwner?: boolean | null; role?: string | null; t: Dictionary["badges"] }) {
  if (isOwner) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded border border-amber-400/60 bg-amber-400/15 px-1.5 text-[10px] font-black uppercase tracking-wide text-amber-300">
        👑 {t.owner}
      </span>
    );
  }
  if (role === "admin") return <span className="rounded bg-accent px-1.5 text-[10px] font-bold uppercase text-white">{t.admin}</span>;
  if (role === "moderator") return <span className="rounded border border-accent/60 px-1.5 text-[10px] font-bold uppercase text-accent-hover">{t.moderator}</span>;
  return null;
}
