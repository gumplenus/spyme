import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

export default function RegisterConfirmPage() {
  return (
    <AuthShell eyebrow="SPYME // VERIFY" title="Проверьте канал">
      <p className="font-mono text-sm leading-6 text-neon/80">
        Досье создано. Подтвердите email — после этого вернёмся к выбору страны и роли.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.22em] text-neon underline decoration-neon/40 underline-offset-4"
      >
        Перейти ко входу
      </Link>
    </AuthShell>
  );
}
