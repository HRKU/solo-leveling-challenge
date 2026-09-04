import type { GoalType, Sex } from '@/lib/targets'
import type { DailyCheckin } from '@/lib/types'

export type ReportDailyCheckin = Pick<
  DailyCheckin,
  | 'checkin_date'
  | 'workout_done'
  | 'calories'
  | 'protein_g'
  | 'water_ml'
  | 'sleep_hours'
  | 'steps'
  | 'workout_entries'
>

export type ReportEligibilityStatus =
  | 'eligible'
  | 'not_opted_in'
  | 'incomplete_profile'
  | 'insufficient_daily_logs'
  | 'insufficient_workouts'
  | 'missing_exercise_details'

export interface ReportProfile {
  age: number | null
  sex: Sex | null
  height_cm: number | null
  current_weight_kg: number | null
  target_weight_kg: number | null
  goal_type: GoalType | null
  onboarded: boolean
}

export interface ExerciseReportMetric {
  exercise: string
  mode: string
  sessions: number
  sets: number
  totalReps: number
  totalDurationSeconds: number
  totalLoadVolumeKg: number
  highestWeightKg: number | null
  changeVsBaselinePct: number | null
}

export interface WeeklyReportPayload {
  profile: {
    ageBand: string
    sex: Sex
    heightCm: number
    currentWeightKg: number
    targetWeightKg: number | null
    goal: GoalType
  }
  week: {
    startDate: string
    endDate: string
    checkInDays: number
    workoutDays: number
    averageSleepHours: number | null
    averageSteps: number | null
    averageProteinG: number | null
    averageCalories: number | null
    averageWaterMl: number | null
  }
  habitCoverage: {
    sleepDays: number
    stepsDays: number
    proteinDays: number
    calorieDays: number
    waterDays: number
  }
  adherence: {
    sleepPct: number | null
    stepsPct: number | null
    proteinPct: number | null
    caloriesPct: number | null
    waterPct: number | null
  }
  exerciseSummary: ExerciseReportMetric[]
  personalBaseline: {
    eligibleWeeks: number
    comparisonWindow: string
    workoutDaysChange: number | null
    sleepChangeHours: number | null
    stepsChangePct: number | null
  }
  bodyTrend: {
    weightChangeThisWeekKg: number | null
    fourWeekWeightChangeKg: number | null
    directionMatchesGoal: boolean | null
    bodyFatChangePctPoints: number | null
  }
  dataFlags: {
    hasPersonalBaseline: boolean
    bodyFatAvailable: boolean
  }
}

export interface ReportEligibility {
  status: ReportEligibilityStatus
  checkInDays: number
  workoutDays: number
  hasStructuredExercise: boolean
}
