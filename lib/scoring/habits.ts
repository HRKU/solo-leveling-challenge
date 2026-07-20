import type { DailyTargets } from '@/lib/targets'

export interface HabitXpInput {
  waterMl: number | null
  sleepHours: number | null
  steps: number | null
  proteinG: number | null
  calories: number | null
}

function ratio(value: number | null | undefined, target: number): number {
  if (target <= 0) return 0
  return Math.min(Math.max(value ?? 0, 0) / target, 1)
}

/** Habit XP only — same caps as legacy calculateDailyXP without classic reps. */
export function calculateHabitXp(input: HabitXpInput, targets: DailyTargets): number {
  const points =
    24 * ratio(input.waterMl, targets.waterTarget) +
    10 * ratio(input.sleepHours, targets.sleepTarget) +
    10 * ratio(input.steps, targets.stepsTarget) +
    8 * ratio(input.proteinG, targets.proteinTarget) +
    (input.calories != null ? 8 * ratio(input.calories, targets.calorieTarget) : 0)

  return Math.round(points)
}
