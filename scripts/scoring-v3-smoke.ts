/**
 * Scoring v3 smoke tests — uncapped difficulty × volume.
 * Run: npx tsx scripts/scoring-v3-smoke.ts
 */
import assert from 'node:assert/strict'
import {
  DURATION_XP_PER_MINUTE,
  SCORING_VERSION_V3,
  scoreSetXp,
  scoreWorkoutV3,
} from '../lib/scoring/v2'
import type { WorkoutEntry } from '../lib/workout-logger'

function entry(
  exerciseId: string,
  sets: { reps?: number | null; durationSec?: number | null; weight?: number | null }[],
  weightUnit: 'kg' | 'lb' = 'kg'
): WorkoutEntry {
  return {
    id: `${exerciseId}-e`,
    exerciseId,
    weightUnit,
    notes: '',
    sets: sets.map((s, i) => ({
      id: `s${i}`,
      reps: s.reps ?? null,
      durationSec: s.durationSec ?? null,
      weight: s.weight ?? null,
    })),
  }
}

// Per-set volume
assert.equal(scoreSetXp('bodyweight_reps', 1, 100, null), 100)
assert.equal(scoreSetXp('bodyweight_reps', 1, 200, null), 200)
assert.equal(scoreSetXp('bodyweight_reps', 0.75, 75, null), 56.25)
assert.equal(scoreSetXp('weighted_reps', 1.4, 10, null), 14)
// Weight ignored (same reps → same XP)
assert.equal(scoreSetXp('weighted_reps', 1, 10, null), scoreSetXp('weighted_reps', 1, 10, null))
assert.equal(scoreSetXp('duration', 1, null, 60), DURATION_XP_PER_MINUTE)
assert.equal(scoreSetXp('duration', 0.8, null, 180), 0.8 * 3 * DURATION_XP_PER_MINUTE)

// Monday: 1 big set each vs split — identical
const monBig = scoreWorkoutV3([
  entry('pushups', [{ reps: 100 }]),
  entry('squats', [{ reps: 200 }]),
  entry('leg-raises', [{ reps: 75 }]),
])
const monSplit = scoreWorkoutV3([
  entry('pushups', [{ reps: 25 }, { reps: 25 }, { reps: 25 }, { reps: 25 }]),
  entry('squats', [{ reps: 50 }, { reps: 50 }, { reps: 50 }, { reps: 50 }]),
  entry('leg-raises', [{ reps: 25 }, { reps: 25 }, { reps: 25 }]),
])
assert.equal(monBig.workoutXp, 356)
assert.equal(monSplit.workoutXp, 356)
assert.equal(monBig.rawWorkout, monSplit.rawWorkout)

// Tuesday deadlift 5×10 @ 75kg — weight ignored
const tue = scoreWorkoutV3([
  entry('deadlift', [
    { reps: 10, weight: 75 },
    { reps: 10, weight: 75 },
    { reps: 10, weight: 75 },
    { reps: 10, weight: 75 },
    { reps: 10, weight: 75 },
  ]),
])
assert.equal(tue.workoutXp, 70) // 1.4 × 50

const tueLight = scoreWorkoutV3([
  entry('deadlift', Array.from({ length: 5 }, () => ({ reps: 10, weight: 40 }))),
])
assert.equal(tueLight.workoutXp, tue.workoutXp)

// Today: 4×10 DB press + 4×10 OHP
const today = scoreWorkoutV3([
  entry('dumbbell-chest-press', Array.from({ length: 4 }, () => ({ reps: 10, weight: 30 }))),
  entry('overhead-press', Array.from({ length: 4 }, () => ({ reps: 10, weight: 20 }))),
])
assert.equal(today.workoutXp, 84) // 40 + 44

// No soft cap — monster day stays uncapped
assert.ok(monBig.workoutXp > 110)

// Pull-ups use catalogue difficulty 2
const pulls = scoreWorkoutV3([entry('pullups', Array.from({ length: 5 }, () => ({ reps: 8 })))])
assert.equal(pulls.workoutXp, 80) // 2 × 40

assert.equal(monBig.breakdown.version, SCORING_VERSION_V3)

console.log('scoring-v3-smoke: ok')
