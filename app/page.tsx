import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(57,255,20,0.14),_transparent_50%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs tracking-[0.5em] text-neon/70">CLASSIFIED // SPYME</p>
        <h1 className="mt-4 font-display text-5xl tracking-[0.28em] text-neon drop-shadow-[0_0_22px_rgba(57,255,20,0.5)]">
          SPYME
        </h1>
        <p className="mt-4 max-w-md font-mono text-sm text-neon/70">
          Темная комната. Неоновый след. Ваша легенда начинается с допуска.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/login"
            className="border border-neon bg-neon/10 px-6 py-2.5 font-mono text-xs uppercase tracking-[0.28em] text-neon hover:bg-neon hover:text-ink"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="border border-neon/40 px-6 py-2.5 font-mono text-xs uppercase tracking-[0.28em] text-neon/80 hover:border-neon hover:text-neon"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}