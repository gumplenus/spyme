// lib/gameCycle.ts

/**
 * Проверяет, находится ли игрок в онбординге (первые 3 дня).
 */
export function isInOnboarding(onboardingEndsAt: string | Date | null): boolean {
  if (!onboardingEndsAt) return false;
  return new Date(onboardingEndsAt) > new Date();
}

/**
 * Вычисляет, сколько часов осталось до конца онбординга.
 */
export function hoursUntilOnboardingEnds(onboardingEndsAt: string | Date): number {
  const end = new Date(onboardingEndsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
}