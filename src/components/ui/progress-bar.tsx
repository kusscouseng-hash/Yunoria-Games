import { cn } from "@/lib/cn";

/** Fortschrittsbalken – z. B. für XP bis zum nächsten Level. */
export function ProgressBar({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
