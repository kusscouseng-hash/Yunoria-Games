"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<"input">, "type"> & {
  label: string;
  hint?: string;
  showLabel: string;
  hideLabel: string;
};

/** Passwortfeld mit Auge-Symbol zum Ein-/Ausblenden des Passworts. */
export function PasswordInput({ label, hint, showLabel, hideLabel, id, name, className, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? name;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          aria-describedby={hintId}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            "h-11 w-full rounded-lg border border-border bg-surface-2 pl-3 pr-12 text-sm text-foreground placeholder:text-subtle",
            "transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-subtle transition-colors hover:text-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}
