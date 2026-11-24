import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

/** Rahmen für Anmelde-, Registrier- und Passwortseiten. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:py-16">
      <Card className="animate-fade-up p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-lg border border-accent/40 bg-accent-soft px-3 py-2.5 text-sm text-accent-hover"
          : "rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-sm text-success"
      }
    >
      {children}
    </div>
  );
}
