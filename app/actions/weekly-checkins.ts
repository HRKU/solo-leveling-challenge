'use server'

import { createClient } from '@/lib/supabase/server'
import { currentWeekStartDate } from '@/lib/week'
import { revalidatePath } from 'next/cache'

export interface WeeklyCheckinFormState {
  error?: string
  success?: boolean
  created?: boolean
}

export async function submitWeeklyCheckin(
  _prevState: WeeklyCheckinFormState | undefined,
  formData: FormData
): Promise<WeeklyCheckinFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const weightKg = Number(formData.get('weightKg'))
  const bodyFatPctRaw = formData.get('bodyFatPct') as string
  const bodyFatPct = bodyFatPctRaw ? Number(bodyFatPctRaw) : null

  if (!weightKg || weightKg <= 0) {
    return { error: 'Please enter a valid weight.' }
  }

  const weekStartDate = currentWeekStartDate()

  const { data: existingWeek } = await supabase
    .from('weekly_checkins')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStartDate)
    .maybeSingle()

  const { error: checkinError } = await supabase.from('weekly_checkins').upsert(
    {
      user_id: user.id,
      week_start_date: weekStartDate,
      weight_kg: weightKg,
      body_fat_pct: bodyFatPct,
    },
    { onConflict: 'user_id,week_start_date' }
  )

  if (checkinError) {
    return { error: checkinError.message }
  }

  // profiles.current_weight_kg is only ever written here or at onboarding —
  // one write path, consistent with how score_xp -> total_xp is handled.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ current_weight_kg: weightKg })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath('/')
  revalidatePath('/progress')

  return { success: true, created: !existingWeek }
}
