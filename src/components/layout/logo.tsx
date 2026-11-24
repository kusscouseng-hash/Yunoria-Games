import { siteConfig } from "@/config/site";

/** Logo: Mondsichel + aufgeschlagenes Buch (Lesebändchen = Stiel des Y) und Schriftzug. */
export function Logo() {
  const [first, ...rest] = siteConfig.name.split(" ");
  return (
    <span className="flex min-w-0 items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- kleines SVG, keine Bildoptimierung nötig */}
      <img src="/brand/emblem.svg" alt="" aria-hidden="true" width={40} height={40} className="h-10 w-10 shrink-0 -my-1" />
      <span className="truncate whitespace-nowrap text-base font-extrabold tracking-tight text-foreground max-[339px]:hidden sm:text-lg">
        {first}
        {rest.length > 0 && <span className="text-accent"> {rest.join(" ")}</span>}
      </span>
    </span>
  );
}
