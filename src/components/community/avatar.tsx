import { cn } from "@/lib/cn";

const AVATAR_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/`;

/** Profilbild oder Anfangsbuchstabe. Nur Bilder aus unserem eigenen Speicher werden angezeigt. */
export function Avatar({ url, name, size = 36, className }: { url: string | null | undefined; name: string; size?: number; className?: string }) {
  const safe = url && url.startsWith(AVATAR_PREFIX) ? url : null;
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-3 font-bold text-muted", className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {safe ? (
        // eslint-disable-next-line @next/next/no-img-element -- kleine, bereits optimierte Bilder aus dem eigenen Speicher
        <img src={safe} alt="" width={size} height={size} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
