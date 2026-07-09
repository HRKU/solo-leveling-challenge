export type Sex = 'male' | 'female' | 'other'
export type GoalType = 'lose' | 'gain' | 'maintain'

export interface ProfileForTargets {
  age: number
  sex: Sex
  heightCm: number
  currentWeightKg: number
  goalType: GoalType
}

export interface DailyTargets {
  calorieTarget: number
  proteinTarget: number
  waterTarget: number
  sleepTarget: number
  stepsTarget: number
}

// Fixed, non-personalized defaults — same for every user regardless of profile.
const SLEEP_TARGET_HOURS = 8
const STEPS_TARGET = 8000

// "Lightly active" Mifflin-St Jeor activity multiplier. No separate
// activity-level input is collected, so this is a single fixed default.
const ACTIVITY_MULTIPLIER = 1.375

// +-500 kcal/day is the standard rule of thumb for a sustainable ~0.45 kg
// (1 lb)/week rate of change.
const CALORIE_DEFICIT = 500
const CALORIE_SURPLUS = 500

// 1.8 g/kg bodyweight/day: midpoint of the standard 1.6-2.2 g/kg range for
// active adults, high enough to support muscle retention/growth across all
// three goal types without a goal-specific branch.
const PROTEIN_G_PER_KG = 1.8

// 33 ml/kg bodyweight/day: midpoint of the commonly cited 30-35 ml/kg
// hydration guideline.
const WATER_ML_PER_KG = 33

/**
 * BMR via Mifflin-St Jeor. For sex = 'other', averages the male/female
 * offsets — a pragmatic choice since the formula only publishes two
 * sex-specific variants.
 */
function calculateBmr({ age, sex, heightCm, currentWeightKg }: ProfileForTargets): number {
  const base = 10 * currentWeightKg + 6.25 * heightCm - 5 * age
  if (sex === 'male') return base + 5
  if (sex === 'female') return base - 161
  return base + (5 + -161) / 2
}

function calculateTdee(bmr: number): number {
  return bmr * ACTIVITY_MULTIPLIER
}

function calculateCalorieTarget(tdee: number, goalType: GoalType): number {
  if (goalType === 'lose') return tdee - CALORIE_DEFICIT
  if (goalType === 'gain') return tdee + CALORIE_SURPLUS
  return tdee
}

/**
 * Computes today's personalized targets from a profile snapshot. Pure and
 * stateless — no caching, so results are always fresh after a weekly weight
 * update or an onboarding edit.
 */
export function calculateDailyTargets(profile: ProfileForTargets): DailyTargets {
  const bmr = calculateBmr(profile)
  const tdee = calculateTdee(bmr)
  const calorieTarget = Math.round(calculateCalorieTarget(tdee, profile.goalType))
  const proteinTarget = Math.round(profile.currentWeightKg * PROTEIN_G_PER_KG)
  const waterTarget = Math.round(profile.currentWeightKg * WATER_ML_PER_KG)

  return {
    calorieTarget,
    proteinTarget,
    waterTarget,
    sleepTarget: SLEEP_TARGET_HOURS,
    stepsTarget: STEPS_TARGET,
  }
}
