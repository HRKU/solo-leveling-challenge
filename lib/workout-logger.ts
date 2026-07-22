import type { CatalogExercise, LoggingMode } from '@/lib/exercise-catalog'
import { getExerciseById } from '@/lib/exercise-catalog'
import { estimateWorkoutXpV2 } from '@/lib/scoring/v2'

export type WeightUnit = 'kg' | 'lb'

export interface WorkoutSet {
  id: string
  reps: number | null
  durationSec: number | null
  weight: number | null
}

export interface WorkoutEntry {
  id: string
  exerciseId: string
  weightUnit: WeightUnit
  notes: string
  sets: WorkoutSet[]
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function emptySet(mode: LoggingMode): WorkoutSet {
  return {
    id: newId('set'),
    reps: mode === 'duration' || mode === 'weighted_duration' ? null : 8,
    durationSec: mode === 'duration' || mode === 'weighted_duration' ? 30 : null,
    weight: mode === 'weighted_reps' || mode === 'weighted_duration' ? 20 : null,
  }
}

export function createEntry(exerciseId: string): WorkoutEntry {
  const exercise = getExerciseById(exerciseId)
  const mode = exercise?.loggingMode ?? 'bodyweight_reps'
  return {
    id: newId('entry'),
    exerciseId,
    weightUnit: 'kg',
    notes: '',
    sets: [emptySet(mode)],
  }
}

export function duplicateSet(set: WorkoutSet): WorkoutSet {
  return { ...set, id: newId('set') }
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export function summarizeEntry(entry: WorkoutEntry, exercise?: CatalogExercise): string {
  const ex = exercise ?? getExerciseById(entry.exerciseId)
  const mode = ex?.loggingMode ?? 'bodyweight_reps'
  const sets = entry.sets.filter((s) => {
    if (mode === 'duration' || mode === 'weighted_duration') return (s.durationSec ?? 0) > 0
    return (s.reps ?? 0) > 0
  })
  if (sets.length === 0) return 'No sets yet'

  if (mode === 'duration') {
    const parts = sets.map((s) => formatDuration(s.durationSec ?? 0))
    return `${sets.length}× ${parts.join(', ')}`
  }

  if (mode === 'weighted_duration') {
    const parts = sets.map((s) => {
      const d = formatDuration(s.durationSec ?? 0)
      const w = s.weight != null ? ` @ ${s.weight}${entry.weightUnit}` : ''
      return `${d}${w}`
    })
    return `${sets.length}× ${parts.join(', ')}`
  }

  if (mode === 'weighted_reps') {
    // Group identical set schemes: 3×5 @ 100kg
    const first = sets[0]
    const same =
      first &&
      sets.every(
        (s) => s.reps === first.reps && s.weight === first.weight
      )
    if (same && first) {
      return `${sets.length}×${first.reps ?? 0} @ ${first.weight ?? 0}${entry.weightUnit}`
    }
    return sets
      .map((s) => `${s.reps ?? 0}× @ ${s.weight ?? 0}${entry.weightUnit}`)
      .join(', ')
  }

  // bodyweight_reps
  const first = sets[0]
  const same = first && sets.every((s) => s.reps === first.reps)
  if (same && first) return `${sets.length}×${first.reps ?? 0}`
  return sets.map((s) => `${s.reps ?? 0}`).join(', ')
}

/** Classic catalog ids that map 1:1 onto daily_checkins rep columns / REP_WEIGHTS. */
export const CLASSIC_EXERCISE_IDS = ['pushups', 'pullups', 'squats', 'crunches'] as const
export type ClassicExerciseId = (typeof CLASSIC_EXERCISE_IDS)[number]

export function isClassicExerciseId(id: string): id is ClassicExerciseId {
  return (CLASSIC_EXERCISE_IDS as readonly string[]).includes(id)
}

export function sumEntryReps(entry: WorkoutEntry): number {
  return entry.sets.reduce((sum, s) => sum + Math.max(0, s.reps ?? 0), 0)
}

/** Aggregate classic exercise reps for XP columns + calendar workout habit. */
export function aggregateClassicReps(entries: WorkoutEntry[]): {
  pushups: number | null
  pullups: number | null
  squats: number | null
  crunches: number | null
} {
  const totals: Record<ClassicExerciseId, number> = {
    pushups: 0,
    pullups: 0,
    squats: 0,
    crunches: 0,
  }
  for (const entry of entries) {
    if (!isClassicExerciseId(entry.exerciseId)) continue
    totals[entry.exerciseId] += sumEntryReps(entry)
  }
  return {
    pushups: totals.pushups > 0 ? totals.pushups : null,
    pullups: totals.pullups > 0 ? totals.pullups : null,
    squats: totals.squats > 0 ? totals.squats : null,
    crunches: totals.crunches > 0 ? totals.crunches : null,
  }
}

/**
 * Server-trusted XP for non-classic catalog work (weighted lifts, holds, variants).
 * Classic ids are scored via REP_WEIGHTS / calculateDailyXP instead.
 */
export function scoreEntryXp(entry: WorkoutEntry): number {
  if (isClassicExerciseId(entry.exerciseId)) return 0
  const ex = getExerciseById(entry.exerciseId)
  if (!ex) return 0
  const d = ex.difficulty
  let total = 0
  for (const set of entry.sets) {
    switch (ex.loggingMode) {
      case 'bodyweight_reps':
        total += (set.reps ?? 0) * d
        break
      case 'weighted_reps':
        total += (set.reps ?? 0) * d * (1 + Math.min(set.weight ?? 0, 200) / 200)
        break
      case 'duration':
        total += (set.durationSec ?? 0) * d
        break
      case 'weighted_duration':
        total +=
          (set.durationSec ?? 0) * d * (1 + Math.min(set.weight ?? 0, 100) / 100)
        break
    }
  }
  return Math.round(total)
}

export function scoreExtraWorkoutXp(entries: WorkoutEntry[]): number {
  return entries.reduce((sum, e) => sum + scoreEntryXp(e), 0)
}

/** UI estimate — v3 volume XP (matches server; weight ignored). */
export function estimateEntryXp(entry: WorkoutEntry): number {
  return estimateWorkoutXpV2([entry])
}

export function estimateWorkoutXp(entries: WorkoutEntry[]): number {
  return estimateWorkoutXpV2(entries)
}

export function createEntryWithReps(exerciseId: ClassicExerciseId, reps: number): WorkoutEntry {
  const entry = createEntry(exerciseId)
  entry.sets = [
    {
      id: newId('set'),
      reps,
      durationSec: null,
      weight: null,
    },
  ]
  return entry
}

/** Load logger state from JSON column, or synthesize from legacy classic columns. */
export function hydrateWorkoutEntries(checkin: {
  workout_entries?: WorkoutEntry[] | null
  pushups?: number | null
  pullups?: number | null
  squats?: number | null
  crunches?: number | null
} | null): WorkoutEntry[] {
  if (checkin?.workout_entries && Array.isArray(checkin.workout_entries) && checkin.workout_entries.length > 0) {
    return checkin.workout_entries
  }
  if (!checkin) return []
  const entries: WorkoutEntry[] = []
  if (checkin.pushups && checkin.pushups > 0) entries.push(createEntryWithReps('pushups', checkin.pushups))
  if (checkin.pullups && checkin.pullups > 0) entries.push(createEntryWithReps('pullups', checkin.pullups))
  if (checkin.squats && checkin.squats > 0) entries.push(createEntryWithReps('squats', checkin.squats))
  if (checkin.crunches && checkin.crunches > 0) entries.push(createEntryWithReps('crunches', checkin.crunches))
  return entries
}

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.20462) * 10) / 10
}
