import type { DailyTargets } from '../targets'
import type { ExerciseReportMetric, WeeklyReportPayload } from '../weekly-report/types'

export type PersonalQuestType = 'checkin_days' | 'workout_days' | 'habit_target_days' | 'exercise_sessions' | 'exercise_total_reps' | 'exercise_total_sets' | 'exercise_total_duration'
export type HabitQuestKey = 'water_ml' | 'sleep_hours' | 'steps' | 'protein_g'
export type QuestFocus = 'consistency' | 'workout' | 'habit' | 'exercise'
export type PersonalQuestParameters = Record<string, never> | { habit: HabitQuestKey; dailyTarget: number; unit: string } | { exerciseId: string; exerciseName: string; unit: 'sessions' | 'reps' | 'sets' | 'minutes' }

export interface PersonalQuestDraft { questType: PersonalQuestType; parameters: PersonalQuestParameters; title: string; description: string; target: number; xpReward: number }
export interface PersonalQuestCandidate extends PersonalQuestDraft { candidateId: string; focus: QuestFocus; evidence: string; score: number }
export interface PersonalQuestHistory { quest_type: PersonalQuestType; parameters: Record<string, unknown>; target: number; status: 'active' | 'completed' | 'expired' }

const DAY_MS = 86_400_000
function shiftDate(date: string, days: number): string { const timestamp = Date.parse(`${date}T00:00:00Z`); if (!Number.isFinite(timestamp)) throw new Error('Invalid report week start date.'); return new Date(timestamp + days * DAY_MS).toISOString().slice(0, 10) }
export function questPeriodAfter(reportWeekStartDate: string) { return { startsOn: shiftDate(reportWeekStartDate, 7), endsOn: shiftDate(reportWeekStartDate, 13) } }
function bounded(value: number, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, Math.round(value))) }
function roundedProgression(baseline: number, increment: number, maximum: number) { if (baseline >= maximum) return maximum; return Math.min(maximum, Math.max(baseline, Math.ceil((baseline * 1.1) / increment) * increment)) }

export function questXpReward(type: PersonalQuestType, target: number): number {
  if (type === 'checkin_days') return target <= 3 ? 10 : target <= 5 ? 15 : 20
  if (type === 'workout_days' || type === 'habit_target_days') return target <= 3 ? 20 : target <= 5 ? 30 : 40
  if (type === 'exercise_total_reps') return target <= 25 ? 25 : target <= 75 ? 35 : 45
  if (type === 'exercise_total_sets') return target <= 8 ? 25 : target <= 12 ? 35 : 45
  if (type === 'exercise_total_duration') return target <= 5 ? 25 : target <= 10 ? 35 : 45
  return target <= 3 ? 25 : target <= 4 ? 35 : 45
}

function sameHistory(candidate: PersonalQuestCandidate, history: PersonalQuestHistory) {
  if (candidate.questType !== history.quest_type) return false
  const candidateExercise = 'exerciseId' in candidate.parameters ? candidate.parameters.exerciseId : null
  const historyExercise = typeof history.parameters.exerciseId === 'string' ? history.parameters.exerciseId : null
  const candidateHabit = 'habit' in candidate.parameters ? candidate.parameters.habit : null
  const historyHabit = typeof history.parameters.habit === 'string' ? history.parameters.habit : null
  return candidateExercise === historyExercise && candidateHabit === historyHabit
}

function applyHistory(candidate: PersonalQuestCandidate, history: PersonalQuestHistory[]) {
  const previous = history.find((item) => sameHistory(candidate, item))
  if (!previous) return candidate
  const target = previous.status === 'expired' ? Math.min(candidate.target, previous.target) : candidate.target
  return { ...candidate, target, xpReward: questXpReward(candidate.questType, target), score: candidate.score - (previous.status === 'expired' ? 18 : 8) }
}

function habitCandidate(payload: WeeklyReportPayload, targets: DailyTargets) {
  const candidates = [
    payload.adherence.waterPct == null ? null : { key: 'water_ml' as const, label: 'Water', coverage: payload.habitCoverage.waterDays, adherence: payload.adherence.waterPct, dailyTarget: targets.waterTarget, unit: 'ml', order: 0 },
    payload.adherence.sleepPct == null ? null : { key: 'sleep_hours' as const, label: 'Sleep', coverage: payload.habitCoverage.sleepDays, adherence: payload.adherence.sleepPct, dailyTarget: targets.sleepTarget, unit: 'hours', order: 1 },
    payload.adherence.stepsPct == null ? null : { key: 'steps' as const, label: 'Steps', coverage: payload.habitCoverage.stepsDays, adherence: payload.adherence.stepsPct, dailyTarget: targets.stepsTarget, unit: 'steps', order: 2 },
    payload.adherence.proteinPct == null ? null : { key: 'protein_g' as const, label: 'Protein', coverage: payload.habitCoverage.proteinDays, adherence: payload.adherence.proteinPct, dailyTarget: targets.proteinTarget, unit: 'g', order: 3 },
  ]
  return candidates.filter((item): item is NonNullable<typeof item> => item != null && item.coverage >= 3 && item.adherence >= 60).sort((a, b) => a.adherence - b.adherence || b.coverage - a.coverage || a.order - b.order)[0] ?? null
}

function exerciseCandidates(metric: ExerciseReportMetric): PersonalQuestCandidate[] {
  if (!metric.exerciseId || metric.sessions <= 0) return []
  const shared = { exerciseId: metric.exerciseId, exerciseName: metric.exercise }
  const result: PersonalQuestCandidate[] = []
  const sessionTarget = bounded(metric.sessions + 1, 2, 4)
  result.push({ candidateId: `exercise_sessions:${metric.exerciseId}`, questType: 'exercise_sessions', parameters: { ...shared, unit: 'sessions' }, title: `${metric.exercise} practice`, description: `Log ${metric.exercise} in ${sessionTarget} workout sessions this week.`, target: sessionTarget, xpReward: questXpReward('exercise_sessions', sessionTarget), focus: 'exercise', evidence: `${metric.sessions} logged sessions last week`, score: 72 + Math.min(metric.sessions, 4) * 2 })
  const repMode = metric.mode === 'bodyweight_reps' || metric.mode === 'weighted_reps'
  if (repMode && metric.sessions >= 2 && metric.totalReps >= 4 && metric.totalReps <= 250) {
    const target = roundedProgression(metric.totalReps, metric.totalReps >= 20 ? 5 : 1, 250)
    result.push({ candidateId: `exercise_total_reps:${metric.exerciseId}`, questType: 'exercise_total_reps', parameters: { ...shared, unit: 'reps' }, title: `${metric.exercise} total`, description: `Complete ${target} total ${metric.exercise} reps this week, across any number of sessions.`, target, xpReward: questXpReward('exercise_total_reps', target), focus: 'exercise', evidence: `${metric.totalReps} reps across ${metric.sessions} sessions last week`, score: 80 })
  }
  if (metric.sessions >= 2 && metric.sets >= 4 && metric.sets <= 24) {
    const target = roundedProgression(metric.sets, 1, 24)
    result.push({ candidateId: `exercise_total_sets:${metric.exerciseId}`, questType: 'exercise_total_sets', parameters: { ...shared, unit: 'sets' }, title: `${metric.exercise} sets`, description: `Complete ${target} total ${metric.exercise} sets this week.`, target, xpReward: questXpReward('exercise_total_sets', target), focus: 'exercise', evidence: `${metric.sets} completed sets last week`, score: 76 })
  }
  const durationMode = metric.mode === 'duration' || metric.mode === 'weighted_duration'
  const minutes = Math.ceil(metric.totalDurationSeconds / 60)
  if (durationMode && metric.sessions >= 1 && minutes >= 1 && minutes <= 120) {
    const target = roundedProgression(minutes, 1, 120)
    result.push({ candidateId: `exercise_total_duration:${metric.exerciseId}`, questType: 'exercise_total_duration', parameters: { ...shared, unit: 'minutes' }, title: `${metric.exercise} time`, description: `Accumulate ${target} total minutes of ${metric.exercise} this week.`, target, xpReward: questXpReward('exercise_total_duration', target), focus: 'exercise', evidence: `${minutes} logged minutes last week`, score: 80 })
  }
  return result
}

export function buildPersonalQuestCandidates(payload: WeeklyReportPayload, targets: DailyTargets, history: PersonalQuestHistory[] = []): PersonalQuestCandidate[] {
  const checkinTarget = bounded(payload.week.checkInDays + 1, 4, 7)
  const workoutTarget = bounded(payload.week.workoutDays + 1, 3, 5)
  const candidates: PersonalQuestCandidate[] = [
    { candidateId: 'checkin_days', questType: 'checkin_days', parameters: {}, title: 'Weekly consistency', description: `Complete a check-in on ${checkinTarget} different days this week.`, target: checkinTarget, xpReward: questXpReward('checkin_days', checkinTarget), focus: 'consistency', evidence: `${payload.week.checkInDays} check-in days last week`, score: 92 },
    { candidateId: 'workout_days', questType: 'workout_days', parameters: {}, title: 'Training rhythm', description: `Complete a workout on ${workoutTarget} different days this week.`, target: workoutTarget, xpReward: questXpReward('workout_days', workoutTarget), focus: 'workout', evidence: `${payload.week.workoutDays} workout days last week`, score: 90 },
  ]
  const habit = habitCandidate(payload, targets)
  if (habit) {
    const target = bounded(habit.coverage + (habit.adherence >= 90 ? 1 : 0), 3, 6)
    candidates.push({ candidateId: `habit_target_days:${habit.key}`, questType: 'habit_target_days', parameters: { habit: habit.key, dailyTarget: habit.dailyTarget, unit: 'days' }, title: `${habit.label} target`, description: `Reach ${habit.dailyTarget} ${habit.unit} on ${target} days this week.`, target, xpReward: questXpReward('habit_target_days', target), focus: 'habit', evidence: `${habit.adherence}% average target adherence across ${habit.coverage} logged days`, score: 78 + Math.max(0, 90 - habit.adherence) / 10 })
  }
  const exercises = [...payload.exerciseSummary].filter((metric) => typeof metric.exerciseId === 'string').sort((a, b) => b.sessions - a.sessions || a.exerciseId.localeCompare(b.exerciseId)).slice(0, 3)
  for (const metric of exercises) candidates.push(...exerciseCandidates(metric))
  return candidates.map((candidate) => applyHistory(candidate, history))
}

function exerciseId(candidate: PersonalQuestCandidate) { return 'exerciseId' in candidate.parameters ? candidate.parameters.exerciseId : null }
export function isValidQuestSelection(selected: PersonalQuestCandidate[]): boolean {
  if (selected.length !== 3 || new Set(selected.map((item) => item.candidateId)).size !== 3 || new Set(selected.map((item) => item.questType)).size !== 3) return false
  if (!selected.some((item) => item.focus === 'consistency' || item.focus === 'workout') || selected.filter((item) => item.focus === 'exercise').length > 2) return false
  const exercises = selected.map(exerciseId).filter((id): id is string => id != null)
  return new Set(exercises).size === exercises.length
}

export function selectQuestCandidates(candidates: PersonalQuestCandidate[], preferredIds?: readonly string[]): PersonalQuestCandidate[] {
  if (preferredIds) {
    const preferred = preferredIds.map((id) => candidates.find((candidate) => candidate.candidateId === id)).filter((item): item is PersonalQuestCandidate => item != null)
    if (isValidQuestSelection(preferred)) return preferred
  }
  const ranked = [...candidates].sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId))
  let best: PersonalQuestCandidate[] = []
  for (let a = 0; a < ranked.length; a++) for (let b = a + 1; b < ranked.length; b++) for (let c = b + 1; c < ranked.length; c++) {
    const group = [ranked[a], ranked[b], ranked[c]]
    if (isValidQuestSelection(group) && group.reduce((sum, item) => sum + item.score, 0) > best.reduce((sum, item) => sum + item.score, 0)) best = group
  }
  return best.length > 0 ? best : ranked.slice(0, Math.min(3, ranked.length))
}

export function selectPersonalQuests(payload: WeeklyReportPayload, targets: DailyTargets): PersonalQuestDraft[] { return selectQuestCandidates(buildPersonalQuestCandidates(payload, targets)) }

export function buildPersonalQuestRows(args: { userId: string; reportId: string; reportWeekStartDate: string; payload: WeeklyReportPayload; targets: DailyTargets; history?: PersonalQuestHistory[]; selectedQuests?: PersonalQuestDraft[]; missions?: readonly string[] }) {
  const { startsOn, endsOn } = questPeriodAfter(args.reportWeekStartDate)
  const quests = args.selectedQuests ?? selectQuestCandidates(buildPersonalQuestCandidates(args.payload, args.targets, args.history))
  return quests.map((quest, index) => ({ user_id: args.userId, source_report_id: args.reportId, quest_type: quest.questType, parameters: quest.parameters, title: quest.title, description: args.missions?.[index] ?? quest.description, target: quest.target, progress: 0, starts_on: startsOn, ends_on: endsOn, status: 'active' as const, xp_reward: quest.xpReward }))
}
