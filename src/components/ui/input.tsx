import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type InputProps = ComponentProps<"input"> & { label: string; hint?: string; error?: string };

/** Beschriftetes Eingabefeld im Designsystem. */
export function Input({ label, hint, error, id, name, className, ...props }: InputProps) {
  const inputId = id ?? name;
  const hintId = hint || error ? `${inputId}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-describedby={hintId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-subtle",
          "transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400/30",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={hintId} className="flex items-start gap-1.5 text-xs font-semibold text-red-300">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
