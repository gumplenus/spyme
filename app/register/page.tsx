import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell eyebrow="SPYME // RECRUIT" title="Регистрация">
      <RegisterForm />
    </AuthShell>
  );
}
