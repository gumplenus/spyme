import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, error, children }: FieldProps) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.22em] text-neon/80">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block font-mono text-xs text-danger">{error}</span>
      ) : null}
    </label>
  );
}

export const inputClassName =
  "w-full border border-neon/30 bg-ink px-3 py-2.5 font-mono text-sm text-neon outline-none placeholder:text-neon/30 focus:border-neon focus:shadow-neon";

export const buttonClassName =
  "mt-2 w-full border border-neon bg-neon/10 py-2.5 font-mono text-sm uppercase tracking-[0.28em] text-neon transition hover:bg-neon hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";
