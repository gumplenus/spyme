// src/app/login/page.tsx
import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell eyebrow="SPYME // ACCESS" title="Вход">
      <Suspense fallback={<p className="font-mono text-sm text-neon/60">Загрузка канала…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}