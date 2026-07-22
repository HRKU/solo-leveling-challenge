import { getExerciseById } from '@/lib/exercise-catalog'
import type { ScoreBreakdown, ScoreBreakdownPerExercise } from '@/lib/types'
import type { WorkoutEntry } from '@/lib/workout-logger'

/** Live scoring stamp — uncapped difficulty × volume (no PR, no soft cap). */
export const SCORING_VERSION_V3 = 3 as const

/** @deprecated Use SCORING_VERSION_V3 */
export const SCORING_VERSION_V2 = SCORING_VERSION_V3

/** XP per minute of duration work at difficulty 1. */
export const DURATION_XP_PER_MINUTE = 6 as const

export function isSetCompleted(reps: number | null, durationSec: number | null): boolean {
  return (reps != null && reps > 0) || (durationSec != null && durationSec > 0)
}

/**
 * Per-set XP (v3): difficulty × reps, or difficulty × minutes × 6 for duration modes.
 * Weight is ignored. No per-set cap.
 */
export function scoreSetXp(
  loggingMode: string,
  difficulty: number,
  reps: number | null,
  durationSec: number | null
): number {
  if (!isSetCompleted(reps, durationSec)) return 0

  const diff = Number.isFinite(difficulty) && difficulty > 0 ? difficulty : 1

  if (loggingMode === 'duration' || loggingMode === 'weighted_duration') {
    const minutes = Math.max(0, durationSec ?? 0) / 60
    return diff * minutes * DURATION_XP_PER_MINUTE
  }

  return diff * Math.max(0, reps ?? 0)
}

export interface ScoreWorkoutResult {
  workoutXp: number
  rawWorkout: number
  perExercise: ScoreBreakdownPerExercise[]
  breakdown: Omit<ScoreBreakdown, 'habitXp'> & { habitXp?: number }
}

/**
 * Volume workout XP (v3). No soft cap, no completion bonus, no PR.
 * Weight on sets is ignored for scoring.
 */
export function scoreWorkoutV3(entries: WorkoutEntry[]): ScoreWorkoutResult {
  const perExercise: ScoreBreakdownPerExercise[] = []
  let setXpTotal = 0

  for (const entry of entries) {
    const ex = getExerciseById(entry.exerciseId)
    const difficulty = ex?.difficulty ?? 1
    const mode = ex?.loggingMode ?? 'bodyweight_reps'
    let entrySetXp = 0

    for (const set of entry.sets) {
      entrySetXp += scoreSetXp(mode, difficulty, set.reps, set.durationSec)
    }

    perExercise.push({ exerciseId: entry.exerciseId, setXp: Math.round(entrySetXp * 100) / 100 })
    setXpTotal += entrySetXp
  }

  const rawWorkout = Math.round(setXpTotal * 100) / 100
  const workoutXp = Math.round(setXpTotal)

  return {
    workoutXp,
    rawWorkout,
    perExercise,
    breakdown: {
      version: SCORING_VERSION_V3,
      workoutXp,
      rawWorkout,
      perExercise,
    },
  }
}

/** @deprecated Prefer scoreWorkoutV3 — same formula; prevBest ignored. */
export function scoreWorkoutV2(
  entries: WorkoutEntry[],
  _prevBestByExercise?: Map<string, number>
): ScoreWorkoutResult & { completionBonus: number; prBonuses: [] } {
  const result = scoreWorkoutV3(entries)
  return { ...result, completionBonus: 0, prBonuses: [] }
}

/** Client-facing estimate — matches server (weight/PR ignored). */
export function estimateWorkoutXpV3(entries: WorkoutEntry[]): number {
  return scoreWorkoutV3(entries).workoutXp
}

/** @deprecated Use estimateWorkoutXpV3 */
export function estimateWorkoutXpV2(entries: WorkoutEntry[]): number {
  return estimateWorkoutXpV3(entries)
}

export function buildScoreBreakdown(workout: ScoreWorkoutResult, habitXp: number): ScoreBreakdown {
  return {
    version: SCORING_VERSION_V3,
    workoutXp: workout.workoutXp,
    habitXp,
    rawWorkout: workout.rawWorkout,
    perExercise: workout.perExercise,
  }
}
