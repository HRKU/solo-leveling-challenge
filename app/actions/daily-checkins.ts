'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateDailyTargets } from '@/lib/targets'
import { calculateDailyXP, computeNextStreak, levelForTotalXp, rankForLevel } from '@/lib/xp'
import { revalidatePath } from 'next/cache'

export interface CheckinFormState {
  error?: string
  success?: boolean
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

  const targets = calculateDailyTargets({
    age: profile.age,
    sex: profile.sex,
    heightCm: profile.height_cm,
    currentWeightKg: profile.current_weight_kg,
    goalType: profile.goal_type,
  })

  const workoutDone = formData.get('workoutDone') === 'on'
  const workoutType = (formData.get('workoutType') as string) || null
  const durationMinutes = formData.get('durationMinutes') ? Number(formData.get('durationMinutes')) : null
  const calories = formData.get('calories') ? Number(formData.get('calories')) : null
  const proteinG = formData.get('proteinG') ? Number(formData.get('proteinG')) : null
  const waterMl = formData.get('waterMl') ? Number(formData.get('waterMl')) : null
  const sleepHours = formData.get('sleepHours') ? Number(formData.get('sleepHours')) : null
  const steps = formData.get('steps') ? Number(formData.get('steps')) : null
  const notes = (formData.get('notes') as string) || null

  // score_xp is computed here, server-side, from raw inputs + personalized
  // targets — never read from the client, never rendered as an editable
  // form field. This is the entire trust boundary for the scoring system.
  const scoreXp = calculateDailyXP(
    { workoutDone, waterMl, sleepHours, steps, proteinG, calories },
    targets
  )

  const today = new Date().toISOString().slice(0, 10)

  const { error: upsertError } = await supabase.from('daily_checkins').upsert(
    {
      user_id: user.id,
      checkin_date: today,
      workout_done: workoutDone,
      workout_type: workoutType,
      duration_minutes: durationMinutes,
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

  const nextStreak = computeNextStreak(profile.last_log_date, today, profile.current_streak)

  // Self-healing: total_xp is re-summed from all checkins rather than
  // incrementally adjusted, so a prior partial failure can't leave it stale.
  const { data: allCheckins } = await supabase
    .from('daily_checkins')
    .select('score_xp')
    .eq('user_id', user.id)

  const totalXp = (allCheckins ?? []).reduce((sum, c) => sum + c.score_xp, 0)
  const level = levelForTotalXp(totalXp)
  const rank = rankForLevel(level)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      total_xp: totalXp,
      level,
      rank,
      current_streak: nextStreak,
      last_log_date: today,
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath('/')
  revalidatePath('/leaderboard')
  revalidatePath('/calendar')

  return { success: true }
}
