import type { DailyTargets } from '@/lib/targets'

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

export interface DailyCheckinInput {
  pushups: number | null
  pullups: number | null
  crunches: number | null
  squats: number | null
  waterMl: number | null
  sleepHours: number | null
  steps: number | null
  proteinG: number | null
  calories: number | null
}

// Points per rep — uncapped, no daily ceiling. Pull-ups are weighted highest
// since a comparable rep is much harder to produce than a pushup/crunch/squat.
export const REP_WEIGHTS = {
  pushups: 1,
  pullups: 2,
  crunches: 0.5,
  squats: 1,
} as const

// A "solid single day" reference per exercise — used only to color the
// calendar's workout dot (hit/partial/miss) and to show a suggested number in
// the check-in form. It is NOT a cap: logging beyond this keeps earning XP.
export const REP_REFERENCE = {
  pushups: 30,
  pullups: 10,
  crunches: 30,
  squats: 30,
} as const

const REP_REFERENCE_MAX =
  REP_REFERENCE.pushups * REP_WEIGHTS.pushups +
  REP_REFERENCE.pullups * REP_WEIGHTS.pullups +
  REP_REFERENCE.crunches * REP_WEIGHTS.crunches +
  REP_REFERENCE.squats * REP_WEIGHTS.squats

// One uniform rule for every numeric sub-item apart from reps: linear credit
// capped at hitting/exceeding target, no bonus for overshooting.
function ratio(value: number | null | undefined, target: number): number {
  if (target <= 0) return 0
  return Math.min(Math.max(value ?? 0, 0) / target, 1)
}

function repPoints(input: DailyCheckinInput): number {
  return (
    Math.max(input.pushups ?? 0, 0) * REP_WEIGHTS.pushups +
    Math.max(input.pullups ?? 0, 0) * REP_WEIGHTS.pullups +
    Math.max(input.crunches ?? 0, 0) * REP_WEIGHTS.crunches +
    Math.max(input.squats ?? 0, 0) * REP_WEIGHTS.squats
  )
}

/**
 * The day's score IS the day's XP. Reps are uncapped and dominate the
 * priority order by design (more reps always means more XP); water, sleep,
 * steps, protein, and calories stay capped against personalized targets —
 * same partial-credit style as before.
 */
export function calculateDailyXP(input: DailyCheckinInput, targets: DailyTargets): number {
  const points =
    repPoints(input) +
    24 * ratio(input.waterMl, targets.waterTarget) +
    10 * ratio(input.sleepHours, targets.sleepTarget) +
    10 * ratio(input.steps, targets.stepsTarget) +
    8 * ratio(input.proteinG, targets.proteinTarget) +
    (input.calories != null ? 8 * ratio(input.calories, targets.calorieTarget) : 0)

  return Math.round(points)
}

// Rescaled for uncapped rep scoring (a strong workout day alone can land
// ~85-155+ points, vs the old flat-40 ceiling): each level costs 52 more XP
// than the last. Calibrated so a consistent logger still lands around C rank
// and a genuine grinder around B rank in a month, same as before — but truly
// exceptional volume can now push into A/S within a single month, which is
// the point of going uncapped.
export function cumulativeXpForLevel(level: number): number {
  return 26 * level * (level + 1)
}

export function levelForTotalXp(totalXp: number): number {
  let level = 1
  while (cumulativeXpForLevel(level) <= totalXp) {
    level++
  }
  return level
}

export interface XpProgress {
  level: number
  currentLevelFloor: number
  nextLevelThreshold: number
  xpIntoLevel: number
  xpNeededForNextLevel: number
  progressPercent: number
}

export function xpProgressForLevel(totalXp: number): XpProgress {
  const level = levelForTotalXp(totalXp)
  const currentLevelFloor = level === 1 ? 0 : cumulativeXpForLevel(level - 1)
  const nextLevelThreshold = cumulativeXpForLevel(level)
  const xpIntoLevel = totalXp - currentLevelFloor
  const xpNeededForNextLevel = nextLevelThreshold - currentLevelFloor

  return {
    level,
    currentLevelFloor,
    nextLevelThreshold,
    xpIntoLevel,
    xpNeededForNextLevel,
    progressPercent: xpNeededForNextLevel > 0 ? (xpIntoLevel / xpNeededForNextLevel) * 100 : 100,
  }
}

// E 1-3, D 4-7, C 8-12, B 13-17, A 18-23, S 24+
export function rankForLevel(level: number): Rank {
  if (level <= 3) return 'E'
  if (level <= 7) return 'D'
  if (level <= 12) return 'C'
  if (level <= 17) return 'B'
  if (level <= 23) return 'A'
  return 'S'
}

/**
 * A streak is broken only by a calendar date with no daily_checkins row at
 * all — a logged day with score 0 still keeps it alive. Dates are UTC
 * "YYYY-MM-DD" strings to avoid timezone drift between friends.
 */
export function computeNextStreak(
  lastCheckinDate: string | null,
  today: string,
  currentStreak: number
): number {
  if (!lastCheckinDate) return 1

  const diffMs = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastCheckinDate}T00:00:00Z`)
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))

  if (diffDays === 0) return currentStreak
  if (diffDays === 1) return currentStreak + 1
  return 1
}

export type HabitStatus = 'hit' | 'partial' | 'miss'

export interface DayHabit {
  key: 'workout' | 'water' | 'sleepSteps' | 'nutrition'
  label: string
  priority: 1 | 2 | 3 | 4
  status: HabitStatus
  pointsEarned: number
  pointsMax: number
}

export interface DayHabitBreakdown {
  date: string
  hasCheckin: boolean
  score: number
  habits: DayHabit[]
}

function statusFromRatio(earned: number, max: number): HabitStatus {
  if (max <= 0) return 'miss'
  const r = earned / max
  if (r >= 0.9) return 'hit'
  if (r > 0) return 'partial'
  return 'miss'
}

/**
 * Collapses the scored inputs into 4 priority-ordered habit dots for the
 * calendar view: Workout -> Water -> Sleep & Steps -> Nutrition.
 * For scoring v2 rows, pass workoutXpOverride from score_breakdown.workoutXp
 * so the workout dot matches the stored effort-based score.
 */
export function buildDayHabitBreakdown(
  date: string,
  checkin: DailyCheckinInput | null,
  targets: DailyTargets,
  options?: {
    scoringVersion?: number | null
    workoutXpOverride?: number | null
    scoreXp?: number | null
  }
): DayHabitBreakdown {
  if (!checkin) {
    return {
      date,
      hasCheckin: false,
      score: 0,
      habits: [
        { key: 'workout', label: 'Workout', priority: 1, status: 'miss', pointsEarned: 0, pointsMax: REP_REFERENCE_MAX },
        { key: 'water', label: 'Water', priority: 2, status: 'miss', pointsEarned: 0, pointsMax: 24 },
        { key: 'sleepSteps', label: 'Sleep & Steps', priority: 3, status: 'miss', pointsEarned: 0, pointsMax: 20 },
        { key: 'nutrition', label: 'Nutrition', priority: 4, status: 'miss', pointsEarned: 0, pointsMax: 16 },
      ],
    }
  }

  const useV2 = options?.scoringVersion === 2 && options.workoutXpOverride != null
  const workoutPoints = useV2 ? options.workoutXpOverride! : repPoints(checkin)
  const workoutPointsMax = useV2 ? 90 : REP_REFERENCE_MAX

  const waterPoints = 24 * ratio(checkin.waterMl, targets.waterTarget)
  const sleepStepsPoints =
    10 * ratio(checkin.sleepHours, targets.sleepTarget) + 10 * ratio(checkin.steps, targets.stepsTarget)
  const nutritionPoints =
    8 * ratio(checkin.proteinG, targets.proteinTarget) +
    (checkin.calories != null ? 8 * ratio(checkin.calories, targets.calorieTarget) : 0)

  const score =
    options?.scoreXp != null
      ? options.scoreXp
      : Math.round(workoutPoints + waterPoints + sleepStepsPoints + nutritionPoints)

  return {
    date,
    hasCheckin: true,
    score,
    habits: [
      {
        key: 'workout',
        label: 'Workout',
        priority: 1,
        status: statusFromRatio(Math.min(workoutPoints, workoutPointsMax), workoutPointsMax),
        pointsEarned: Math.round(workoutPoints),
        pointsMax: Math.round(workoutPointsMax),
      },
      {
        key: 'water',
        label: 'Water',
        priority: 2,
        status: statusFromRatio(waterPoints, 24),
        pointsEarned: Math.round(waterPoints),
        pointsMax: 24,
      },
      {
        key: 'sleepSteps',
        label: 'Sleep & Steps',
        priority: 3,
        status: statusFromRatio(sleepStepsPoints, 20),
        pointsEarned: Math.round(sleepStepsPoints),
        pointsMax: 20,
      },
      {
        key: 'nutrition',
        label: 'Nutrition',
        priority: 4,
        status: statusFromRatio(nutritionPoints, 16),
        pointsEarned: Math.round(nutritionPoints),
        pointsMax: 16,
      },
    ],
  }
}
