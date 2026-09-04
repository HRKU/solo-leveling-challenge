import assert from 'node:assert/strict'
import { buildWeeklyReportPayload, evaluateReportEligibility, lastCompletedWeek } from '../lib/weekly-report/aggregate'
import type { DailyCheckin, WeeklyCheckin } from '../lib/types'
import type { ReportProfile } from '../lib/weekly-report/types'

const profile: ReportProfile = {
  age: 28,
  sex: 'male',
  height_cm: 178,
  current_weight_kg: 80,
  target_weight_kg: 76,
  goal_type: 'lose',
  onboarded: true,
}

function checkin(date: string, workout = false, reps = 0): DailyCheckin {
  return {
    id: date,
    user_id: 'user-1',
    checkin_date: date,
    workout_done: workout,
    workout_type: null,
    duration_minutes: workout ? 40 : null,
    pushups: reps || null,
    pullups: null,
    crunches: null,
    squats: null,
    calories: 2200,
    protein_g: 140,
    water_ml: 2600,
    sleep_hours: 7.5,
    steps: 8500,
    notes: 'must never enter the payload',
    workout_entries: reps ? [{
      id: `entry-${date}`,
      exerciseId: 'pushups',
      weightUnit: 'kg',
      notes: 'private exercise note',
      sets: [{ id: `set-${date}`, reps, durationSec: null, weight: null }],
    }] : [],
    scoring_version: 3,
    score_breakdown: null,
    score_xp: 10,
    created_at: `${date}T00:00:00Z`,
    updated_at: `${date}T00:00:00Z`,
  }
}

assert.deepEqual(lastCompletedWeek(new Date('2026-09-04T12:00:00Z')), {
  startDate: '2026-08-24',
  endDate: '2026-08-30',
})

const tooFew = [checkin('2026-08-24', true, 20), checkin('2026-08-25')]
assert.equal(evaluateReportEligibility(profile, tooFew, true).status, 'insufficient_daily_logs')
assert.equal(evaluateReportEligibility(profile, [...tooFew, checkin('2026-08-26')], true).status, 'insufficient_workouts')

const current = [
  checkin('2026-08-24', true, 30),
  checkin('2026-08-25'),
  checkin('2026-08-27', true, 40),
]
assert.equal(evaluateReportEligibility(profile, current, true).status, 'eligible')
assert.equal(evaluateReportEligibility(profile, current, false).status, 'not_opted_in')

const baseline = [
  checkin('2026-08-10', true, 20), checkin('2026-08-11'), checkin('2026-08-12', true, 30),
  checkin('2026-08-17', true, 25), checkin('2026-08-18'), checkin('2026-08-19', true, 35),
]
const weights: WeeklyCheckin[] = [
  { id: 'w1', user_id: 'user-1', week_start_date: '2026-08-17', weight_kg: 80.5, body_fat_pct: 20, created_at: '', updated_at: '' },
  { id: 'w2', user_id: 'user-1', week_start_date: '2026-08-24', weight_kg: 80, body_fat_pct: 19.8, created_at: '', updated_at: '' },
]
const payload = buildWeeklyReportPayload({ profile, checkins: [...baseline, ...current], weeklyCheckins: weights, weekStartDate: '2026-08-24' })
assert.equal(payload.dataFlags.hasPersonalBaseline, true)
assert.equal(payload.exerciseSummary[0]?.exercise, 'Push-ups')
assert.equal(payload.exerciseSummary[0]?.changeVsBaselinePct, 27)
assert.equal(payload.bodyTrend.weightChangeThisWeekKg, -0.5)
assert.equal(JSON.stringify(payload).includes('private'), false)

console.log('weekly report smoke checks passed')
