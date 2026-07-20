import { getExerciseById } from '@/lib/exercise-catalog'
import type { ScoreBreakdown, ScoreBreakdownPerExercise, ScoreBreakdownPrBonus } from '@/lib/types'
import { lbToKg, type WorkoutEntry } from '@/lib/workout-logger'

export const SCORING_VERSION_V2 = 2 as const

export const V2_LIMITS = {
  setXpCap: 12,
  repsCountedMax: 50,
  durationMinutesMax: 5,
  completionBonus: 5,
  softWorkoutCap: 90,
  hardWorkoutCeiling: 110,
  prBonusBase: 12,
  prBonusScale: 8,
  prBonusCap: 20,
  prRelCap: 0.3,
} as const

/** Convert a set weight to kilograms (canonical scoring unit). */
export function weightToKg(weight: number | null | undefined, unit: 'kg' | 'lb'): number | null {
  if (weight == null || !Number.isFinite(weight) || weight < 0) return null
  return unit === 'lb' ? lbToKg(weight) : weight
}

export function isSetCompleted(reps: number | null, durationSec: number | null): boolean {
  return (reps != null && reps > 0) || (durationSec != null && durationSec > 0)
}

export function scoreSetXp(
  loggingMode: string,
  difficulty: number,
  reps: number | null,
  durationSec: number | null
): number {
  if (!isSetCompleted(reps, durationSec)) return 0

  let effort = 2 // set base

  if (loggingMode === 'duration' || loggingMode === 'weighted_duration') {
    const minutes = Math.max(0, durationSec ?? 0) / 60
    const capped = Math.min(minutes, V2_LIMITS.durationMinutesMax)
    effort += Math.min(capped, 1) * 6 + Math.max(0, capped - 1) * 2
  } else {
    const r = Math.max(0, reps ?? 0)
    const counted = Math.min(r, V2_LIMITS.repsCountedMax)
    effort += Math.min(counted, 20) * 0.4 + Math.max(0, Math.min(counted, 50) - 20) * 0.15
  }

  return Math.min(V2_LIMITS.setXpCap, difficulty * effort)
}

export function computePrBonus(todayBestKg: number, prevBestKg: number): number {
  if (!(todayBestKg > prevBestKg) || prevBestKg <= 0) return 0
  // Scale relative gain so ~30% improvement hits the bonus cap (base 12 → 20).
  const rel = Math.min((todayBestKg - prevBestKg) / prevBestKg, V2_LIMITS.prRelCap)
  const scaled = rel / V2_LIMITS.prRelCap
  return Math.min(
    V2_LIMITS.prBonusCap,
    V2_LIMITS.prBonusBase + V2_LIMITS.prBonusScale * scaled
  )
}

export function applySoftWorkoutCap(rawWorkout: number): number {
  const { softWorkoutCap: soft, hardWorkoutCeiling: ceil } = V2_LIMITS
  if (rawWorkout <= soft) return rawWorkout
  return Math.min(ceil, soft + (rawWorkout - soft) * 0.25)
}

export function todayBestKgForEntry(entry: WorkoutEntry): number | null {
  let best: number | null = null
  for (const set of entry.sets) {
    const kg = weightToKg(set.weight, entry.weightUnit)
    if (kg == null) continue
    if (best == null || kg > best) best = kg
  }
  return best
}

/** Max kg per exerciseId from historical entries (already excluding current day). */
export function buildPrevBestKgMap(
  historicalEntries: { exerciseId: string; weightUnit: 'kg' | 'lb'; sets: { weight: number | null }[] }[]
): Map<string, number> {
  const map = new Map<string, number>()
  for (const entry of historicalEntries) {
    for (const set of entry.sets) {
      const kg = weightToKg(set.weight, entry.weightUnit)
      if (kg == null) continue
      const prev = map.get(entry.exerciseId)
      if (prev == null || kg > prev) map.set(entry.exerciseId, kg)
    }
  }
  return map
}

export interface ScoreWorkoutV2Result {
  workoutXp: number
  rawWorkout: number
  completionBonus: number
  prBonuses: ScoreBreakdownPrBonus[]
  perExercise: ScoreBreakdownPerExercise[]
  breakdown: Omit<ScoreBreakdown, 'habitXp'> & { habitXp?: number }
}

/**
 * Effort-based workout XP (v2). Does not include habits.
 * @param prevBestByExercise prior best kg per exerciseId (empty map = no PRs)
 */
export function scoreWorkoutV2(
  entries: WorkoutEntry[],
  prevBestByExercise: Map<string, number> = new Map()
): ScoreWorkoutV2Result {
  const perExercise: ScoreBreakdownPerExercise[] = []
  const prBonuses: ScoreBreakdownPrBonus[] = []
  let setXpTotal = 0
  let anyCompleted = false

  for (const entry of entries) {
    const ex = getExerciseById(entry.exerciseId)
    const difficulty = ex?.difficulty ?? 1
    const mode = ex?.loggingMode ?? 'bodyweight_reps'
    let entrySetXp = 0

    for (const set of entry.sets) {
      const xp = scoreSetXp(mode, difficulty, set.reps, set.durationSec)
      if (xp > 0) anyCompleted = true
      entrySetXp += xp
    }

    perExercise.push({ exerciseId: entry.exerciseId, setXp: Math.round(entrySetXp * 100) / 100 })
    setXpTotal += entrySetXp

    if (mode === 'weighted_reps' || mode === 'weighted_duration') {
      const todayBest = todayBestKgForEntry(entry)
      const prevBest = prevBestByExercise.get(entry.exerciseId)
      if (todayBest != null && prevBest != null) {
        const bonus = computePrBonus(todayBest, prevBest)
        if (bonus > 0) {
          prBonuses.push({
            exerciseId: entry.exerciseId,
            prevBestKg: Math.round(prevBest * 100) / 100,
            todayBestKg: Math.round(todayBest * 100) / 100,
            bonus: Math.round(bonus * 100) / 100,
          })
        }
      }
    }
  }

  const prTotal = prBonuses.reduce((s, p) => s + p.bonus, 0)
  const completionBonus = anyCompleted ? V2_LIMITS.completionBonus : 0
  const rawWorkout = setXpTotal + prTotal + completionBonus
  const workoutXp = Math.round(applySoftWorkoutCap(rawWorkout))

  return {
    workoutXp,
    rawWorkout: Math.round(rawWorkout * 100) / 100,
    completionBonus,
    prBonuses,
    perExercise,
    breakdown: {
      version: SCORING_VERSION_V2,
      workoutXp,
      rawWorkout: Math.round(rawWorkout * 100) / 100,
      completionBonus,
      prBonuses,
      perExercise,
    },
  }
}

/** Client-facing estimate: workout XP without PR history (server adds PRs). */
export function estimateWorkoutXpV2(entries: WorkoutEntry[]): number {
  return scoreWorkoutV2(entries, new Map()).workoutXp
}

export function buildScoreBreakdown(
  workout: ScoreWorkoutV2Result,
  habitXp: number
): ScoreBreakdown {
  return {
    version: SCORING_VERSION_V2,
    workoutXp: workout.workoutXp,
    habitXp,
    rawWorkout: workout.rawWorkout,
    completionBonus: workout.completionBonus,
    prBonuses: workout.prBonuses,
    perExercise: workout.perExercise,
  }
}
