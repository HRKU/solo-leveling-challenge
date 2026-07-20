/**
 * Scoring v2 formula smoke tests.
 * Run: npx tsx scripts/scoring-v2-smoke.ts
 */
import assert from 'node:assert/strict'
import {
  applySoftWorkoutCap,
  buildPrevBestKgMap,
  computePrBonus,
  scoreSetXp,
  scoreWorkoutV2,
  weightToKg,
  V2_LIMITS,
} from '../lib/scoring/v2'
import { calculateHabitXp } from '../lib/scoring/habits'
import type { WorkoutEntry } from '../lib/workout-logger'

function entry(
  exerciseId: string,
  sets: { reps?: number | null; durationSec?: number | null; weight?: number | null }[],
  weightUnit: 'kg' | 'lb' = 'kg'
): WorkoutEntry {
  return {
    id: `e_${exerciseId}`,
    exerciseId,
    weightUnit,
    notes: '',
    sets: sets.map((s, i) => ({
      id: `s_${i}`,
      reps: s.reps ?? null,
      durationSec: s.durationSec ?? null,
      weight: s.weight ?? null,
    })),
  }
}

// kg canonical
assert.ok(Math.abs((weightToKg(100, 'lb') ?? 0) - 45.4) < 0.1)
assert.equal(weightToKg(60, 'kg'), 60)

// set caps
assert.ok(scoreSetXp('bodyweight_reps', 1, 10, null) < V2_LIMITS.setXpCap)
assert.equal(scoreSetXp('bodyweight_reps', 1, 200, null), scoreSetXp('bodyweight_reps', 1, 50, null))
assert.ok(scoreSetXp('duration', 1, null, 600) <= V2_LIMITS.setXpCap)
assert.equal(scoreSetXp('duration', 1, null, 600), scoreSetXp('duration', 1, null, 300))

// soft cap
assert.equal(applySoftWorkoutCap(50), 50)
assert.ok(applySoftWorkoutCap(200) <= V2_LIMITS.hardWorkoutCeiling)
assert.ok(applySoftWorkoutCap(200) > V2_LIMITS.softWorkoutCap)

// PR
assert.equal(computePrBonus(60, 60), 0)
assert.ok(computePrBonus(65, 60) >= 12)
assert.equal(computePrBonus(100, 60), V2_LIMITS.prBonusCap)

// lb vs kg same mass for prev best map
const mapKg = buildPrevBestKgMap([
  { exerciseId: 'barbell-bench-press', weightUnit: 'kg', sets: [{ weight: 45.4 }] },
])
const mapLb = buildPrevBestKgMap([
  { exerciseId: 'barbell-bench-press', weightUnit: 'lb', sets: [{ weight: 100 }] },
])
assert.ok(Math.abs((mapKg.get('barbell-bench-press') ?? 0) - (mapLb.get('barbell-bench-press') ?? 0)) < 0.15)

// first lift no PR
const first = scoreWorkoutV2([entry('barbell-bench-press', [{ reps: 5, weight: 60 }])], new Map())
assert.equal(first.prBonuses.length, 0)

// later PR
const withPrev = scoreWorkoutV2(
  [entry('barbell-bench-press', [{ reps: 5, weight: 65 }])],
  new Map([['barbell-bench-press', 60]])
)
assert.ok(withPrev.prBonuses.length === 1)
assert.ok(withPrev.prBonuses[0]!.bonus >= 12)

// habits still work
const habits = calculateHabitXp(
  { waterMl: 3000, sleepHours: 8, steps: 8000, proteinG: 150, calories: 2000 },
  { waterTarget: 3000, sleepTarget: 8, stepsTarget: 8000, proteinTarget: 150, calorieTarget: 2000 }
)
assert.ok(habits >= 50)

// pushups use v2 effort not classic weights alone
const push = scoreWorkoutV2([entry('pushups', [{ reps: 10 }, { reps: 10 }, { reps: 10 }])])
assert.ok(push.workoutXp > 0)
assert.ok(push.completionBonus === 5)

console.log('scoring-v2-smoke: ok')
