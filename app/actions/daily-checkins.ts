'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateDailyTargets } from '@/lib/targets'
import { calculateDailyXP, computeNextStreak } from '@/lib/xp'
import { resumTotalXp } from '@/lib/xp-resum'
import { revalidatePath } from 'next/cache'

export interface CheckinFormState {
  error?: string
  success?: boolean
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
  // Which day this entry is for — defaults to today so the dashboard form
  // (which doesn't pass a date) keeps working unchanged. Safe to trust from
  // the client: it only selects which row gets written, not how many points
  // it's worth (score is still computed server-side below regardless of
  // date). The only guardrail that matters is rejecting the future.
  const date = (formData.get('date') as string) || today
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

  const workoutType = (formData.get('workoutType') as string) || null
  const durationMinutes = formData.get('durationMinutes') ? Number(formData.get('durationMinutes')) : null
  const pushups = formData.get('pushups') ? Number(formData.get('pushups')) : null
  const pullups = formData.get('pullups') ? Number(formData.get('pullups')) : null
  const crunches = formData.get('crunches') ? Number(formData.get('crunches')) : null
  const squats = formData.get('squats') ? Number(formData.get('squats')) : null
  const calories = formData.get('calories') ? Number(formData.get('calories')) : null
  const proteinG = formData.get('proteinG') ? Number(formData.get('proteinG')) : null
  // Users enter water in liters (e.g. "5"); stored/scored as ml internally
  // so the personalized target formula (lib/targets.ts) doesn't need to change.
  const waterLiters = formData.get('waterLiters') ? Number(formData.get('waterLiters')) : null
  const waterMl = waterLiters != null ? Math.round(waterLiters * 1000) : null
  const sleepHours = formData.get('sleepHours') ? Number(formData.get('sleepHours')) : null
  const steps = formData.get('steps') ? Number(formData.get('steps')) : null
  const notes = (formData.get('notes') as string) || null

  // Derived, not client-trusted for scoring purposes — just a convenience
  // flag for "did something happen today" beyond the rep counts themselves.
  const workoutDone = Boolean(
    (pushups && pushups > 0) ||
      (pullups && pullups > 0) ||
      (crunches && crunches > 0) ||
      (squats && squats > 0) ||
      workoutType ||
      (durationMinutes && durationMinutes > 0)
  )

  // score_xp is computed here, server-side, from raw inputs + personalized
  // targets — never read from the client, never rendered as an editable
  // form field. This is the entire trust boundary for the scoring system.
  const scoreXp = calculateDailyXP(
    { pushups, pullups, crunches, squats, waterMl, sleepHours, steps, proteinG, calories },
    targets
  )

  const { error: upsertError } = await supabase.from('daily_checkins').upsert(
    {
      user_id: user.id,
      checkin_date: date,
      workout_done: workoutDone,
      workout_type: workoutType,
      duration_minutes: durationMinutes,
      pushups,
      pullups,
      crunches,
      squats,
      calories,
      protein_g: proteinG,
      water_ml: waterMl,
      sleep_hours: sleepHours,
      steps,
      notes,
      score_xp: scoreXp,
    },
    { onConflict: 'user_id,checkin_date' }
  )

  if (upsertError) {
    return { error: upsertError.message }
  }

  // Backfilled (non-today) entries are pure historical record-keeping — they
  // count toward total_xp below but never touch the streak, which only ever
  // moves based on real-time logging. This is what makes it impossible to
  // fake/repair a streak by backfilling old days.
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

  return { success: true }
}
