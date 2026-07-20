import type { Rank } from '@/lib/xp'
import type { Sex, GoalType } from '@/lib/targets'
import type { WorkoutEntry } from '@/lib/workout-logger'

export interface Profile {
  id: string
  display_name: string
  name: string | null
  age: number | null
  sex: Sex | null
  height_cm: number | null
  starting_weight_kg: number | null
  current_weight_kg: number | null
  goal_type: GoalType | null
  target_weight_kg: number | null
  total_xp: number
  level: number
  rank: Rank
  current_streak: number
  last_log_date: string | null
  onboarded: boolean
  created_at: string
}

export interface DailyCheckin {
  id: string
  user_id: string
  checkin_date: string
  workout_done: boolean
  workout_type: string | null
  duration_minutes: number | null
  pushups: number | null
  pullups: number | null
  crunches: number | null
  squats: number | null
  calories: number | null
  protein_g: number | null
  water_ml: number | null
  sleep_hours: number | null
  steps: number | null
  notes: string | null
  /** Set-based workout logger payload; null on legacy rows. */
  workout_entries: WorkoutEntry[] | null
  /** null/1 = legacy frozen score; 2 = effort-based v2 */
  scoring_version: number | null
  /** Audit trail for v2 scoring; null on legacy rows. */
  score_breakdown: ScoreBreakdown | null
  score_xp: number
  created_at: string
  updated_at: string
}

export interface ScoreBreakdownPrBonus {
  exerciseId: string
  prevBestKg: number
  todayBestKg: number
  bonus: number
}

export interface ScoreBreakdownPerExercise {
  exerciseId: string
  setXp: number
}

export interface ScoreBreakdown {
  version: 2
  workoutXp: number
  habitXp: number
  rawWorkout: number
  completionBonus: number
  prBonuses: ScoreBreakdownPrBonus[]
  perExercise: ScoreBreakdownPerExercise[]
}

export interface WeeklyCheckin {
  id: string
  user_id: string
  week_start_date: string
  weight_kg: number
  body_fat_pct: number | null
  created_at: string
  updated_at: string
}

export interface Challenge {
  id: string
  creator_id: string
  title: string
  description: string | null
  xp_reward: number
  start_date: string
  end_date: string
  created_at: string
}

export interface ChallengeCompletion {
  id: string
  challenge_id: string
  user_id: string
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}
