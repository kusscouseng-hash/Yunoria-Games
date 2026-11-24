import Link from "next/link";
import { cn } from "@/lib/cn";
import type { GuildColor } from "@/lib/supabase/database.types";

const COLORS: Record<GuildColor, { pill: string; tile: string }> = {
  red: { pill: "bg-red-500/15 text-red-300 ring-red-500/40", tile: "from-red-500/40 to-red-950" },
  orange: { pill: "bg-orange-500/15 text-orange-300 ring-orange-500/40", tile: "from-orange-500/40 to-orange-950" },
  amber: { pill: "bg-amber-400/15 text-amber-300 ring-amber-400/40", tile: "from-amber-400/40 to-amber-950" },
  green: { pill: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40", tile: "from-emerald-500/40 to-emerald-950" },
  teal: { pill: "bg-teal-400/15 text-teal-300 ring-teal-400/40", tile: "from-teal-400/40 to-teal-950" },
  blue: { pill: "bg-blue-500/15 text-blue-300 ring-blue-500/40", tile: "from-blue-500/40 to-blue-950" },
  violet: { pill: "bg-violet-500/15 text-violet-300 ring-violet-500/40", tile: "from-violet-500/40 to-violet-950" },
  pink: { pill: "bg-pink-500/15 text-pink-300 ring-pink-500/40", tile: "from-pink-500/40 to-pink-950" },
};
export const GUILD_COLOR_LIST = Object.keys(COLORS) as GuildColor[];

/** Kleines Gilden-Kürzel, z. B. „⚔ NR“ – optional als Link zur Gilde. */
export function GuildTag({ tag, color, href, className }: { tag: string; emblem?: string; color: GuildColor; href?: string; className?: string }) {
  const cls = cn("inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ring-1", COLORS[color].pill, className);
  const inner = <>🛡 {tag}</>;
  return href ? (
    <Link href={href} className={cn(cls, "hover:brightness-125")}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

const AVATAR_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/`;

/** Gilden-Bild (eigenes Bild) – sonst das Kürzel auf Farbverlauf. */
export function GuildEmblem({ image, tag, color, size = 48, className }: { image?: string | null; tag?: string; color: GuildColor; size?: number; className?: string }) {
  const safe = image && image.startsWith(AVATAR_PREFIX) ? image : null;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br font-black tracking-tight text-white/90", COLORS[color].tile, className)}
      style={{ width: size, height: size, fontSize: size * (tag && tag.length > 3 ? 0.26 : 0.34) }}
      aria-hidden="true"
    >
      {safe ? (
        // eslint-disable-next-line @next/next/no-img-element -- kleine, bereits optimierte Bilder aus dem eigenen Speicher
        <img src={safe} alt="" width={size} height={size} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        tag
      )}
    </span>
  );
}
