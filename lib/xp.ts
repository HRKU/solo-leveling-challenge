import type { DailyTargets } from '@/lib/targets'

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

export interface DailyCheckinInput {
  workoutDone: boolean
  waterMl: number | null
  sleepHours: number | null
  steps: number | null
  proteinG: number | null
  calories: number | null
}

// One uniform rule for every numeric sub-item: linear credit capped at
// hitting/exceeding target, no bonus for overshooting.
function ratio(value: number | null | undefined, target: number): number {
  if (target <= 0) return 0
  return Math.min(Math.max(value ?? 0, 0) / target, 1)
}

/**
 * The day's score IS the day's XP. Point weights strictly decrease by
 * priority: workout (40) > water (24) > sleep+steps (10+10) > nutrition (8+8).
 * Missing calories simply contributes 0 — no penalty beyond not earning
 * those points.
 */
export function calculateDailyXP(input: DailyCheckinInput, targets: DailyTargets): number {
  const points =
    (input.workoutDone ? 40 : 0) +
    24 * ratio(input.waterMl, targets.waterTarget) +
    10 * ratio(input.sleepHours, targets.sleepTarget) +
    10 * ratio(input.steps, targets.stepsTarget) +
    8 * ratio(input.proteinG, targets.proteinTarget) +
    (input.calories != null ? 8 * ratio(input.calories, targets.calorieTarget) : 0)

  return Math.round(points)
}

// Rescaled for a 0-100/day ceiling: each level costs 26 more XP than the last.
export function cumulativeXpForLevel(level: number): number {
  return 13 * level * (level + 1)
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
 * Collapses the 6 scored inputs into 4 priority-ordered habit dots for the
 * calendar view: Workout (most prominent) -> Water -> Sleep & Steps ->
 * Nutrition (least prominent).
 */
export function buildDayHabitBreakdown(
  date: string,
  checkin: DailyCheckinInput | null,
  targets: DailyTargets
): DayHabitBreakdown {
  if (!checkin) {
    return {
      date,
      hasCheckin: false,
      score: 0,
      habits: [
        { key: 'workout', label: 'Workout', priority: 1, status: 'miss', pointsEarned: 0, pointsMax: 40 },
        { key: 'water', label: 'Water', priority: 2, status: 'miss', pointsEarned: 0, pointsMax: 24 },
        { key: 'sleepSteps', label: 'Sleep & Steps', priority: 3, status: 'miss', pointsEarned: 0, pointsMax: 20 },
        { key: 'nutrition', label: 'Nutrition', priority: 4, status: 'miss', pointsEarned: 0, pointsMax: 16 },
      ],
    }
  }

  const workoutPoints = checkin.workoutDone ? 40 : 0
  const waterPoints = 24 * ratio(checkin.waterMl, targets.waterTarget)
  const sleepStepsPoints =
    10 * ratio(checkin.sleepHours, targets.sleepTarget) + 10 * ratio(checkin.steps, targets.stepsTarget)
  const nutritionPoints =
    8 * ratio(checkin.proteinG, targets.proteinTarget) +
    (checkin.calories != null ? 8 * ratio(checkin.calories, targets.calorieTarget) : 0)

  const score = Math.round(workoutPoints + waterPoints + sleepStepsPoints + nutritionPoints)

  return {
    date,
    hasCheckin: true,
    score,
    habits: [
      {
        key: 'workout',
        label: 'Workout',
        priority: 1,
        status: checkin.workoutDone ? 'hit' : 'miss',
        pointsEarned: workoutPoints,
        pointsMax: 40,
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
