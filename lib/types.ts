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
  /** null/1 = legacy; 2 = capped effort+PR (historical); 3 = uncapped volume */
  scoring_version: number | null
  /** Audit trail for v2/v3 scoring; null on legacy rows. */
  score_breakdown: ScoreBreakdown | null
  score_xp: number
  created_at: string
  updated_at: string
}

/** Present on historical v2 breakdowns only. */
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
  version: 2 | 3
  workoutXp: number
  habitXp: number
  rawWorkout: number
  perExercise: ScoreBreakdownPerExercise[]
  /** v2 only — omitted on v3 writes */
  completionBonus?: number
  /** v2 only — omitted on v3 writes */
  prBonuses?: ScoreBreakdownPrBonus[]
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

export interface AiReportPreference {
  user_id: string
  weekly_enabled: boolean
  consented_at: string | null
  updated_at: string
}

export interface WeeklyReportContent {
  verdict: string
  strongestProgress: string
  watchPoint: string
  exerciseInsight: string
  bodyGoalInsight: string
  missions: [string, string, string]
  questCandidateIds?: [string, string, string]
  noxClosing: string
}

export interface AiWeeklyReport {
  id: string
  user_id: string
  week_start_date: string
  status: 'pending' | 'ready' | 'failed'
  report: WeeklyReportContent | null
  source_payload?: import('@/lib/weekly-report/types').WeeklyReportPayload | null
  model: string | null
  prompt_version?: string
  input_tokens?: number | null
  output_tokens?: number | null
  generation_started_at: string
  generated_at: string | null
}

export interface PersonalQuest {
  id: string
  user_id: string
  source_report_id: string
  quest_type: import('@/lib/personal-quests/selection').PersonalQuestType
  parameters: Record<string, unknown>
  title: string
  description: string
  target: number
  progress: number
  starts_on: string
  ends_on: string
  status: 'active' | 'completed' | 'expired'
  xp_reward: number
  completed_at: string | null
  xp_awarded_at: string | null
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
