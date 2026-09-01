import { AuthShell } from "@/components/AuthShell";
import { OnboardingForm } from "@/components/OnboardingForm";

export default function OnboardingPage() {
  return (
    <AuthShell eyebrow="SPYME // COVER" title="Страна и роль">
      <OnboardingForm />
    </AuthShell>
  );
}
