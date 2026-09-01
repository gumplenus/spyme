import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COUNTRIES, ROLES } from "@/lib/game/options";

export default async function GamePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const countryCode = user.user_metadata?.country as string | undefined;
  const roleId = user.user_metadata?.role as string | undefined;
  const country = COUNTRIES.find((item) => item.code === countryCode)?.name ?? "не назначена";
  const role = ROLES.find((item) => item.id === roleId)?.label ?? "не назначена";

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-neon">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(57,255,20,0.1),_transparent_55%)]" />
      <div className="relative mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-xs tracking-[0.4em] text-neon/70">LIVE OPS // CLASSIFIED</p>
        <h1 className="mt-3 font-display text-4xl tracking-[0.22em] drop-shadow-[0_0_18px_rgba(57,255,20,0.45)]">
          Игровой канал
        </h1>
        <div className="mt-8 border border-neon/35 bg-panel/80 p-6 shadow-neon">
          <p className="font-mono text-sm text-neon/80">
            Агент: <span className="text-neon">{user.email}</span>
          </p>
          <p className="mt-2 font-mono text-sm text-neon/80">
            Страна прикрытия: <span className="text-neon">{country}</span>
          </p>
          <p className="mt-2 font-mono text-sm text-neon/80">
            Роль: <span className="text-neon">{role}</span>
          </p>
          <p className="mt-6 font-mono text-xs leading-6 text-neon/55">
            Канал защищён. Неавторизованный доступ перенаправляется на /login.
          </p>
        </div>
        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="border border-neon/40 px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-neon/80 hover:border-neon hover:text-neon"
          >
            Выйти из сети
          </button>
        </form>
      </div>
    </div>
  );
}
