/**
 * Lightweight validation + aggregation checks (no test runner in package.json).
 * Run: npx tsx scripts/checkin-validation-smoke.ts
 */
import assert from 'node:assert/strict'
import {
  CHECKIN_LIMITS,
  dailyCheckinPayloadSchema,
  parseDailyCheckinFormData,
  sanitizeSearchQuery,
} from '../lib/validation/checkin'
import {
  aggregateClassicReps,
  hydrateWorkoutEntries,
  scoreExtraWorkoutXp,
  type WorkoutEntry,
} from '../lib/workout-logger'

const sampleEntry = (exerciseId: string, reps: number): WorkoutEntry => ({
  id: 'entry_1',
  exerciseId,
  weightUnit: 'kg',
  notes: '',
  sets: [{ id: 'set_1', reps, durationSec: null, weight: null }],
})

// Search sanitize
assert.equal(sanitizeSearchQuery('  push  '), 'push')
assert.ok(sanitizeSearchQuery('x'.repeat(200)).length <= CHECKIN_LIMITS.searchQueryMax)
assert.equal(sanitizeSearchQuery('a\u0000b').includes('\u0000'), false)

// Classic aggregation
const classic = aggregateClassicReps([sampleEntry('pushups', 20), sampleEntry('pullups', 5)])
assert.equal(classic.pushups, 20)
assert.equal(classic.pullups, 5)
assert.equal(classic.squats, null)

// Extra XP for non-classic
assert.ok(scoreExtraWorkoutXp([sampleEntry('burpees', 10)]) > 0)
assert.equal(scoreExtraWorkoutXp([sampleEntry('pushups', 10)]), 0)

// Hydrate from legacy columns
const hydrated = hydrateWorkoutEntries({ pushups: 30, pullups: null, squats: 10, crunches: null })
assert.equal(hydrated.length, 2)
assert.equal(hydrated[0]?.exerciseId, 'pushups')

// Reject negative water
assert.equal(
  dailyCheckinPayloadSchema.safeParse({
    waterMl: -1,
    sleepHours: null,
    steps: null,
    proteinG: null,
    calories: null,
    notes: null,
    workoutEntries: [],
  }).success,
  false
)

// Reject oversized steps
assert.equal(
  dailyCheckinPayloadSchema.safeParse({
    waterMl: null,
    sleepHours: null,
    steps: CHECKIN_LIMITS.stepsMax + 1,
    proteinG: null,
    calories: null,
    notes: null,
    workoutEntries: [],
  }).success,
  false
)

// Accept valid payload
assert.equal(
  dailyCheckinPayloadSchema.safeParse({
    date: '2026-07-20',
    waterMl: 500,
    sleepHours: 7.5,
    steps: 8000,
    proteinG: 120,
    calories: 2000,
    notes: 'solid',
    workoutEntries: [sampleEntry('pushups', 40)],
  }).success,
  true
)

// FormData parse rejects NaN
const fd = new FormData()
fd.set('waterMl', 'not-a-number')
fd.set('workoutEntries', '[]')
const bad = parseDailyCheckinFormData(fd)
assert.equal(bad.success, false)

// Unknown exercise rejected
const fd2 = new FormData()
fd2.set(
  'workoutEntries',
  JSON.stringify([sampleEntry('not-a-real-exercise', 10)])
)
const badEx = parseDailyCheckinFormData(fd2)
assert.equal(badEx.success, false)

console.log('checkin-validation-smoke: ok')
