'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateDailyTargets } from '@/lib/targets'
import { calculateDailyXP, computeNextStreak } from '@/lib/xp'
import { resumTotalXp } from '@/lib/xp-resum'
import { parseDailyCheckinFormData } from '@/lib/validation/checkin'
import { aggregateClassicReps, scoreExtraWorkoutXp } from '@/lib/workout-logger'
import { calculateHabitXp } from '@/lib/scoring/habits'
import {
  SCORING_VERSION_V3,
  buildScoreBreakdown,
  scoreWorkoutV3,
} from '@/lib/scoring/v2'
import { revalidatePath } from 'next/cache'

export interface CheckinFormState {
  error?: string
  success?: boolean
  /** True when this upsert created a new row vs updated an existing one. */
  created?: boolean
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function upsertDailyCheckin(
  _prevState: CheckinFormState | undefined,
  formData: FormData
): Promise<CheckinFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('age, sex, height_cm, current_weight_kg, goal_type, current_streak, last_log_date')
    .eq('id', user.id)
    .single()

  if (
    !profile ||
    profile.age == null ||
    !profile.sex ||
    profile.height_cm == null ||
    profile.current_weight_kg == null ||
    !profile.goal_type
  ) {
    return { error: 'Please finish onboarding first.' }
  }

  const today = todayUtc()
  const parsed = parseDailyCheckinFormData(formData)
  if (!parsed.success) {
    return { error: parsed.error }
  }

  const { data: payload } = parsed
  const date = payload.date || today
  if (date > today) {
    return { error: "Can't log a day that hasn't happened yet." }
  }
  const isToday = date === today

  const targets = calculateDailyTargets({
    age: profile.age,
    sex: profile.sex,
    heightCm: profile.height_cm,
    currentWeightKg: profile.current_weight_kg,
    goalType: profile.goal_type,
  })

  const { waterMl, sleepHours, steps, proteinG, calories, notes, workoutEntries } = payload
  const classic = aggregateClassicReps(workoutEntries)

  const { data: existing } = await supabase
    .from('daily_checkins')
    .select('workout_type, duration_minutes')
    .eq('user_id', user.id)
    .eq('checkin_date', date)
    .maybeSingle()

  const created = !existing

  const workoutDone = Boolean(
    (classic.pushups && classic.pushups > 0) ||
      (classic.pullups && classic.pullups > 0) ||
      (classic.crunches && classic.crunches > 0) ||
      (classic.squats && classic.squats > 0) ||
      workoutEntries.length > 0 ||
      existing?.workout_type ||
      (existing?.duration_minutes && existing.duration_minutes > 0)
  )

  // Rollback: SCORING_VERSION=1 forces legacy classic+extra path (columns kept).
  const useLegacyScoring = process.env.SCORING_VERSION === '1'

  let scoreXp: number
  let scoringVersion: number | null
  let scoreBreakdown: ReturnType<typeof buildScoreBreakdown> | null

  if (useLegacyScoring) {
    scoreXp =
      calculateDailyXP(
        {
          pushups: classic.pushups,
          pullups: classic.pullups,
          crunches: classic.crunches,
          squats: classic.squats,
          waterMl,
          sleepHours,
          steps,
          proteinG,
          calories,
        },
        targets
      ) + scoreExtraWorkoutXp(workoutEntries)
    scoringVersion = 1
    scoreBreakdown = null
  } else {
    // Scoring v3 — uncapped difficulty × volume. Weight ignored; no PR / soft cap.
    const workoutScore = scoreWorkoutV3(workoutEntries)
    const habitXp = calculateHabitXp(
      { waterMl, sleepHours, steps, proteinG, calories },
      targets
    )
    scoreXp = workoutScore.workoutXp + habitXp
    scoringVersion = SCORING_VERSION_V3
    scoreBreakdown = buildScoreBreakdown(workoutScore, habitXp)
  }

  const { error: upsertError } = await supabase.from('daily_checkins').upsert(
    {
      user_id: user.id,
      checkin_date: date,
      workout_done: workoutDone,
      workout_type: existing?.workout_type ?? null,
      duration_minutes: existing?.duration_minutes ?? null,
      pushups: classic.pushups,
      pullups: classic.pullups,
      crunches: classic.crunches,
      squats: classic.squats,
      calories,
      protein_g: proteinG,
      water_ml: waterMl,
      sleep_hours: sleepHours,
      steps,
      notes,
      workout_entries: workoutEntries,
      scoring_version: scoringVersion,
      score_breakdown: scoreBreakdown,
      score_xp: scoreXp,
    },
    { onConflict: 'user_id,checkin_date' }
  )

  if (upsertError) {
    return { error: upsertError.message }
  }

  const profileUpdate: Record<string, unknown> = {}
  if (isToday) {
    profileUpdate.current_streak = computeNextStreak(profile.last_log_date, today, profile.current_streak)
    profileUpdate.last_log_date = today
  }

  const { totalXp, level, rank } = await resumTotalXp(supabase, user.id)
  profileUpdate.total_xp = totalXp
  profileUpdate.level = level
  profileUpdate.rank = rank

  const { error: profileError } = await supabase.from('profiles').update(profileUpdate).eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath('/')
  revalidatePath('/leaderboard')
  revalidatePath('/calendar')
  revalidatePath(`/checkin/${date}`)

  return {
    success: true,
    created,
  }
}
