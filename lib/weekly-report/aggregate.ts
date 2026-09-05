import { getExerciseById } from '@/lib/exercise-catalog'
import { calculateDailyTargets } from '@/lib/targets'
import type { WeeklyCheckin } from '@/lib/types'
import { lbToKg, type WorkoutEntry } from '@/lib/workout-logger'
import type {
  ExerciseReportMetric,
  ReportEligibility,
  ReportDailyCheckin,
  ReportProfile,
  WeeklyReportPayload,
} from '@/lib/weekly-report/types'

const DAY_MS = 86_400_000
const BASELINE_WEEKS = 4

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function lastCompletedWeek(reference = new Date()): { startDate: string; endDate: string } {
  const utcDay = reference.getUTCDay()
  const daysSinceMonday = (utcDay + 6) % 7
  const currentMonday = new Date(Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate() - daysSinceMonday
  ))
  const start = new Date(currentMonday.getTime() - 7 * DAY_MS)
  const end = new Date(currentMonday.getTime() - DAY_MS)
  return { startDate: dateOnly(start), endDate: dateOnly(end) }
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return dateOnly(shifted)
}

function rowsForWeek(checkins: ReportDailyCheckin[], startDate: string): ReportDailyCheckin[] {
  const endDate = shiftDate(startDate, 6)
  return checkins.filter((row) => row.checkin_date >= startDate && row.checkin_date <= endDate)
}

function structuredEntries(row: ReportDailyCheckin): WorkoutEntry[] {
  return Array.isArray(row.workout_entries) ? row.workout_entries : []
}

function completedEntry(entry: WorkoutEntry): boolean {
  return entry.sets.some((set) => (set.reps ?? 0) > 0 || (set.durationSec ?? 0) > 0)
}

export function evaluateReportEligibility(
  profile: ReportProfile,
  checkins: ReportDailyCheckin[],
  optedIn: boolean
): ReportEligibility {
  const checkInDays = new Set(checkins.map((row) => row.checkin_date)).size
  const workoutDays = new Set(
    checkins
      .filter((row) => row.workout_done || structuredEntries(row).some(completedEntry))
      .map((row) => row.checkin_date)
  ).size
  const hasStructuredExercise = checkins.some((row) => structuredEntries(row).some(completedEntry))

  let status: ReportEligibility['status'] = 'eligible'
  if (!optedIn) status = 'not_opted_in'
  else if (
    !profile.onboarded || profile.age == null || !profile.sex || profile.height_cm == null ||
    profile.current_weight_kg == null || !profile.goal_type
  ) status = 'incomplete_profile'
  else if (checkInDays < 3) status = 'insufficient_daily_logs'
  else if (workoutDays < 2) status = 'insufficient_workouts'
  else if (!hasStructuredExercise) status = 'missing_exercise_details'

  return { status, checkInDays, workoutDays, hasStructuredExercise }
}

function average(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value != null && Number.isFinite(value))
  if (present.length === 0) return null
  return present.reduce((sum, value) => sum + value, 0) / present.length
}

function rounded(value: number | null, precision = 1): number | null {
  if (value == null) return null
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function percentChange(current: number | null, baseline: number | null): number | null {
  if (current == null || baseline == null || baseline === 0) return null
  return rounded(((current - baseline) / baseline) * 100, 0)
}

function ageBand(age: number): string {
  const lower = Math.floor(age / 10) * 10
  return `${lower}-${lower + 9}`
}

function aggregateExercises(rows: ReportDailyCheckin[]): ExerciseReportMetric[] {
  const metrics = new Map<string, ExerciseReportMetric & { dates: Set<string> }>()

  for (const row of rows) {
    for (const entry of structuredEntries(row)) {
      const exercise = getExerciseById(entry.exerciseId)
      if (!exercise || !completedEntry(entry)) continue
      const metric = metrics.get(entry.exerciseId) ?? {
        exerciseId: entry.exerciseId,
        exercise: exercise.name,
        mode: exercise.loggingMode,
        sessions: 0,
        sets: 0,
        totalReps: 0,
        totalDurationSeconds: 0,
        totalLoadVolumeKg: 0,
        highestWeightKg: null,
        changeVsBaselinePct: null,
        dates: new Set<string>(),
      }
      metric.dates.add(row.checkin_date)

      for (const set of entry.sets) {
        const reps = Math.max(0, set.reps ?? 0)
        const duration = Math.max(0, set.durationSec ?? 0)
        if (reps === 0 && duration === 0) continue
        metric.sets += 1
        metric.totalReps += reps
        metric.totalDurationSeconds += duration
        if (set.weight != null && set.weight > 0) {
          const kg = entry.weightUnit === 'lb' ? lbToKg(set.weight) : set.weight
          metric.highestWeightKg = Math.max(metric.highestWeightKg ?? 0, kg)
          metric.totalLoadVolumeKg += kg * (reps || Math.max(duration / 60, 1))
        }
      }
      metrics.set(entry.exerciseId, metric)
    }
  }

  return [...metrics.values()].map(({ dates, ...metric }) => ({
    ...metric,
    sessions: dates.size,
    totalLoadVolumeKg: rounded(metric.totalLoadVolumeKg, 1) ?? 0,
    highestWeightKg: rounded(metric.highestWeightKg, 1),
  }))
}

function exerciseVolume(metric: ExerciseReportMetric): number {
  if (metric.mode === 'weighted_reps') return metric.totalLoadVolumeKg
  if (metric.mode === 'duration' || metric.mode === 'weighted_duration') return metric.totalDurationSeconds
  return metric.totalReps
}

function adherence(actual: number | null, target: number, calories = false): number | null {
  if (actual == null || target <= 0) return null
  if (calories) return rounded(Math.max(0, 100 - Math.abs(actual - target) / target * 100), 0)
  return rounded(Math.min(100, actual / target * 100), 0)
}

export function buildWeeklyReportPayload(args: {
  profile: ReportProfile
  checkins: ReportDailyCheckin[]
  weeklyCheckins: WeeklyCheckin[]
  weekStartDate: string
}): WeeklyReportPayload {
  const { profile, checkins, weeklyCheckins, weekStartDate } = args
  if (profile.age == null || !profile.sex || profile.height_cm == null || profile.current_weight_kg == null || !profile.goal_type) {
    throw new Error('Cannot build a weekly report payload from an incomplete profile.')
  }

  const currentRows = rowsForWeek(checkins, weekStartDate)
  const baselineStarts = Array.from({ length: BASELINE_WEEKS }, (_, index) => shiftDate(weekStartDate, -(index + 1) * 7))
  const baselineRows = baselineStarts
    .map((start) => rowsForWeek(checkins, start))
    .filter((rows) => evaluateReportEligibility(profile, rows, true).status === 'eligible')
  const hasPersonalBaseline = baselineRows.length >= 2
  const currentExercise = aggregateExercises(currentRows)
  const baselineExercise = baselineRows.map(aggregateExercises)

  for (const metric of currentExercise) {
    const comparable = baselineExercise
      .map((week) => week.find((candidate) => candidate.exercise === metric.exercise) ?? null)
      .filter((candidate): candidate is ExerciseReportMetric => candidate != null)
    metric.changeVsBaselinePct = hasPersonalBaseline
      ? percentChange(exerciseVolume(metric), average(comparable.map(exerciseVolume)))
      : null
  }

  const targets = calculateDailyTargets({
    age: profile.age,
    sex: profile.sex,
    heightCm: profile.height_cm,
    currentWeightKg: profile.current_weight_kg,
    goalType: profile.goal_type,
  })
  const avgSleep = average(currentRows.map((row) => row.sleep_hours))
  const avgSteps = average(currentRows.map((row) => row.steps))
  const avgProtein = average(currentRows.map((row) => row.protein_g))
  const avgCalories = average(currentRows.map((row) => row.calories))
  const avgWater = average(currentRows.map((row) => row.water_ml))
  const workoutDays = evaluateReportEligibility(profile, currentRows, true).workoutDays
  const baselineWorkoutDays = average(baselineRows.map((rows) => evaluateReportEligibility(profile, rows, true).workoutDays))
  const baselineSleep = average(baselineRows.map((rows) => average(rows.map((row) => row.sleep_hours))))
  const baselineSteps = average(baselineRows.map((rows) => average(rows.map((row) => row.steps))))

  const sortedWeights = [...weeklyCheckins]
    .filter((row) => row.week_start_date <= shiftDate(weekStartDate, 6))
    .sort((a, b) => b.week_start_date.localeCompare(a.week_start_date))
  const latestWeight = sortedWeights[0] ?? null
  const previousWeight = sortedWeights.find((row) => row.week_start_date < weekStartDate) ?? null
  const fourWeekBoundary = shiftDate(weekStartDate, -28)
  const olderWeight = [...sortedWeights].reverse().find((row) => row.week_start_date >= fourWeekBoundary) ?? null
  const weeklyWeightChange = latestWeight && previousWeight ? latestWeight.weight_kg - previousWeight.weight_kg : null
  const fourWeekWeightChange = latestWeight && olderWeight && latestWeight.id !== olderWeight.id
    ? latestWeight.weight_kg - olderWeight.weight_kg
    : null
  const directionMatchesGoal = fourWeekWeightChange == null ? null
    : profile.goal_type === 'lose' ? fourWeekWeightChange < 0
      : profile.goal_type === 'gain' ? fourWeekWeightChange > 0
        : Math.abs(fourWeekWeightChange) <= 0.5

  return {
    profile: {
      ageBand: ageBand(profile.age),
      sex: profile.sex,
      heightCm: profile.height_cm,
      currentWeightKg: profile.current_weight_kg,
      targetWeightKg: profile.target_weight_kg,
      goal: profile.goal_type,
    },
    week: {
      startDate: weekStartDate,
      endDate: shiftDate(weekStartDate, 6),
      checkInDays: new Set(currentRows.map((row) => row.checkin_date)).size,
      workoutDays,
      averageSleepHours: rounded(avgSleep),
      averageSteps: rounded(avgSteps, 0),
      averageProteinG: rounded(avgProtein, 0),
      averageCalories: rounded(avgCalories, 0),
      averageWaterMl: rounded(avgWater, 0),
    },
    habitCoverage: {
      sleepDays: currentRows.filter((row) => row.sleep_hours != null).length,
      stepsDays: currentRows.filter((row) => row.steps != null).length,
      proteinDays: currentRows.filter((row) => row.protein_g != null).length,
      calorieDays: currentRows.filter((row) => row.calories != null).length,
      waterDays: currentRows.filter((row) => row.water_ml != null).length,
    },
    adherence: {
      sleepPct: adherence(avgSleep, targets.sleepTarget),
      stepsPct: adherence(avgSteps, targets.stepsTarget),
      proteinPct: adherence(avgProtein, targets.proteinTarget),
      caloriesPct: adherence(avgCalories, targets.calorieTarget, true),
      waterPct: adherence(avgWater, targets.waterTarget),
    },
    exerciseSummary: currentExercise,
    personalBaseline: {
      eligibleWeeks: baselineRows.length,
      comparisonWindow: 'previous 4 eligible weeks',
      workoutDaysChange: hasPersonalBaseline && baselineWorkoutDays != null ? rounded(workoutDays - baselineWorkoutDays) : null,
      sleepChangeHours: hasPersonalBaseline && avgSleep != null && baselineSleep != null ? rounded(avgSleep - baselineSleep) : null,
      stepsChangePct: hasPersonalBaseline ? percentChange(avgSteps, baselineSteps) : null,
    },
    bodyTrend: {
      weightChangeThisWeekKg: rounded(weeklyWeightChange),
      fourWeekWeightChangeKg: rounded(fourWeekWeightChange),
      directionMatchesGoal,
      bodyFatChangePctPoints: latestWeight?.body_fat_pct != null && previousWeight?.body_fat_pct != null
        ? rounded(latestWeight.body_fat_pct - previousWeight.body_fat_pct)
        : null,
    },
    dataFlags: {
      hasPersonalBaseline,
      bodyFatAvailable: latestWeight?.body_fat_pct != null,
    },
  }
}
