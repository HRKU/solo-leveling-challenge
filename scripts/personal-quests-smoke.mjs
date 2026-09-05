import assert from 'node:assert/strict'
import {
  buildPersonalQuestCandidates,
  buildPersonalQuestRows,
  isValidQuestSelection,
  questPeriodAfter,
  questXpReward,
  selectPersonalQuests,
  selectQuestCandidates,
} from '../lib/personal-quests/selection.ts'

const targets = {
  calorieTarget: 2200,
  proteinTarget: 140,
  waterTarget: 2500,
  sleepTarget: 8,
  stepsTarget: 8000,
}

function payload(overrides = {}) {
  return {
    profile: { ageBand: '20-29', sex: 'male', heightCm: 175, currentWeightKg: 75, targetWeightKg: 72, goal: 'lose' },
    week: { startDate: '2026-08-24', endDate: '2026-08-30', checkInDays: 3, workoutDays: 2, averageSleepHours: 7, averageSteps: 7000, averageProteinG: 120, averageCalories: 2200, averageWaterMl: 2200 },
    habitCoverage: { sleepDays: 3, stepsDays: 3, proteinDays: 3, calorieDays: 3, waterDays: 3 },
    adherence: { sleepPct: 88, stepsPct: 88, proteinPct: 86, caloriesPct: 100, waterPct: 88 },
    exerciseSummary: [{ exerciseId: 'pushups', exercise: 'Push-ups', mode: 'bodyweight_reps', sessions: 2, sets: 6, totalReps: 60, totalDurationSeconds: 0, totalLoadVolumeKg: 0, highestWeightKg: null, changeVsBaselinePct: null }],
    personalBaseline: { eligibleWeeks: 0, comparisonWindow: 'previous 4 eligible weeks', workoutDaysChange: null, sleepChangeHours: null, stepsChangePct: null },
    bodyTrend: { weightChangeThisWeekKg: null, fourWeekWeightChangeKg: null, directionMatchesGoal: null, bodyFatChangePctPoints: null },
    dataFlags: { hasPersonalBaseline: false, bodyFatAvailable: false },
    ...overrides,
  }
}

const candidates = buildPersonalQuestCandidates(payload(), targets)
assert.ok(candidates.some((quest) => quest.questType === 'exercise_total_reps' && quest.target === 70))
assert.ok(candidates.some((quest) => quest.questType === 'exercise_total_sets' && quest.target === 7))
assert.ok(candidates.some((quest) => quest.questType === 'habit_target_days'))

const selected = selectPersonalQuests(payload(), targets)
assert.equal(selected.length, 3)
assert.equal(isValidQuestSelection(selectQuestCandidates(candidates)), true)
assert.equal(selected[0].target, 4)
assert.equal(selected[1].target, 3)

const exerciseFallback = selectPersonalQuests(payload({
  adherence: { sleepPct: 50, stepsPct: null, proteinPct: null, caloriesPct: 100, waterPct: null },
}), targets)
assert.equal(exerciseFallback[2].questType, 'exercise_total_reps')
assert.deepEqual(exerciseFallback[2].parameters, { exerciseId: 'pushups', exerciseName: 'Push-ups', unit: 'reps' })
assert.equal(exerciseFallback[2].target, 70)

const aiPreferred = selectQuestCandidates(candidates, ['checkin_days', 'habit_target_days:protein_g', 'exercise_total_reps:pushups'])
assert.deepEqual(aiPreferred.map((quest) => quest.candidateId), ['checkin_days', 'habit_target_days:protein_g', 'exercise_total_reps:pushups'])
const invalidAiSelection = selectQuestCandidates(candidates, ['exercise_sessions:pushups', 'exercise_total_reps:pushups', 'exercise_total_sets:pushups'])
assert.equal(isValidQuestSelection(invalidAiSelection), true)

const durationCandidates = buildPersonalQuestCandidates(payload({
  exerciseSummary: [{ exerciseId: 'plank', exercise: 'Plank', mode: 'duration', sessions: 2, sets: 4, totalReps: 0, totalDurationSeconds: 180, totalLoadVolumeKg: 0, highestWeightKg: null, changeVsBaselinePct: null }],
}), targets)
assert.ok(durationCandidates.some((quest) => quest.questType === 'exercise_total_duration' && quest.target === 4))

const historyAdjusted = buildPersonalQuestCandidates(payload(), targets, [{
  quest_type: 'exercise_total_reps', parameters: { exerciseId: 'pushups' }, target: 60, status: 'expired',
}]).find((quest) => quest.questType === 'exercise_total_reps')
assert.equal(historyAdjusted.target, 60)
assert.ok(historyAdjusted.score < 80)

const sparse = selectPersonalQuests(payload({
  adherence: { sleepPct: null, stepsPct: null, proteinPct: null, caloriesPct: null, waterPct: null },
  exerciseSummary: [],
}), targets)
assert.equal(sparse.length, 2)

const capped = selectPersonalQuests(payload({
  week: { ...payload().week, checkInDays: 7, workoutDays: 7 },
}), targets)
assert.equal(capped[0].target, 7)
assert.equal(capped[1].target, 5)
assert.equal(questXpReward('checkin_days', 7), 20)
assert.equal(questXpReward('exercise_sessions', 3), 25)
assert.equal(questXpReward('exercise_total_reps', 70), 35)

assert.deepEqual(questPeriodAfter('2026-08-24'), {
  startsOn: '2026-08-31',
  endsOn: '2026-09-06',
})

const rows = buildPersonalQuestRows({
  userId: 'user-1',
  reportId: 'report-1',
  reportWeekStartDate: '2026-08-24',
  payload: payload(),
  targets,
  missions: ['Mission one', 'Mission two', 'Mission three'],
})
assert.equal(rows.length, 3)
assert.equal(rows[0].user_id, 'user-1')
assert.equal(rows[0].source_report_id, 'report-1')
assert.equal(rows[0].starts_on, '2026-08-31')
assert.equal(rows[0].ends_on, '2026-09-06')
assert.equal(rows[0].status, 'active')
assert.equal(rows[0].progress, 0)
assert.deepEqual(rows.map((row) => row.description), ['Mission one', 'Mission two', 'Mission three'])
assert.equal(new Set(rows.map((row) => row.quest_type)).size, rows.length)

const legacyExercisePayload = payload({
  adherence: { sleepPct: null, stepsPct: null, proteinPct: null, caloriesPct: null, waterPct: null },
  exerciseSummary: [{ exercise: 'Legacy exercise', mode: 'bodyweight_reps', sessions: 2, sets: 4, totalReps: 40, totalDurationSeconds: 0, totalLoadVolumeKg: 0, highestWeightKg: null, changeVsBaselinePct: null }],
})
assert.equal(selectPersonalQuests(legacyExercisePayload, targets).length, 2)

console.log('Personal quest selection checks passed.')
