import type { ReactNode } from "react";

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight sm:text-2xl">
          <span className="h-6 w-1 rounded-full bg-accent" aria-hidden="true" />
          {title}
        </h2>
        {description && <p className="mt-1 pl-4 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
