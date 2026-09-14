// src/lib/gameCycle.ts

export type GamePhase = 
  | 'REGISTRATION'   // День 1-2
  | 'RECONNAISSANCE' // День 3-4
  | 'HUNTING'        // День 5-10
  | 'CLIMAX'         // День 11-12
  | 'FINAL';         // День 13-14

export function getCurrentDay(startDate: string | Date): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diffDays + 1, 1), 14);
}

export function getCurrentPhase(day: number): GamePhase {
  if (day <= 2) return 'REGISTRATION';
  if (day <= 4) return 'RECONNAISSANCE';
  if (day <= 10) return 'HUNTING';
  if (day <= 12) return 'CLIMAX';
  return 'FINAL';
}

export function getPhaseName(phase: GamePhase): string {
  const names: Record<GamePhase, string> = {
    REGISTRATION: 'Регистрация',
    RECONNAISSANCE: 'Разведка',
    HUNTING: 'Охота',
    CLIMAX: 'Кульминация',
    FINAL: 'Финал',
  };
  return names[phase];
}

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