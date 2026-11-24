import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type InputProps = ComponentProps<"input"> & { label: string; hint?: string };

/** Beschriftetes Eingabefeld im Designsystem. */
export function Input({ label, hint, id, name, className, ...props }: InputProps) {
  const inputId = id ?? name;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-describedby={hintId}
        className={cn(
          "h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-subtle",
          "transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
          className,
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}
