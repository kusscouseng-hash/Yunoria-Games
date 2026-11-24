import type { ReactNode } from "react";
import { Card } from "./card";

/** Ehrlicher Leerzustand: zeigt klar, dass noch keine Daten vorhanden sind. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 border-dashed px-6 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-subtle" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 19.5V5a2 2 0 0 1 2-2h11l3 3v13.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5z" />
          <path d="M8 9h8M8 13h6" />
        </svg>
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="max-w-md text-sm text-muted">{description}</p>
      {action}
    </Card>
  );
}
