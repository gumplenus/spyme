import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-neon">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(57,255,20,0.12),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(57,255,20,0.35)_3px)]" />
      <main className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <p className="mb-2 font-mono text-xs tracking-[0.35em] text-neon/70">
          {eyebrow}
        </p>
        <h1 className="mb-8 font-display text-3xl font-semibold tracking-[0.2em] text-neon drop-shadow-[0_0_18px_rgba(57,255,20,0.45)]">
          {title}
        </h1>
        <div className="rounded-sm border border-neon/40 bg-panel/80 p-6 shadow-neon backdrop-blur-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
