'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Sex, GoalType } from '@/lib/targets'

export interface ProfileFormState {
  error?: string
  success?: boolean
}

// Deliberately excludes starting_weight_kg/current_weight_kg — those stay
// driven exclusively by onboarding's initial value and submitWeeklyCheckin,
// so the /progress weight-trend chart never goes out of sync with whatever
// this form could otherwise let someone set ad hoc.
export async function updateProfile(
  _prevState: ProfileFormState | undefined,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const age = Number(formData.get('age'))
  const sex = formData.get('sex') as Sex
  const heightCm = Number(formData.get('heightCm'))
  const goalType = formData.get('goalType') as GoalType
  const targetWeightKgRaw = formData.get('targetWeightKg') as string
  const targetWeightKg = targetWeightKgRaw ? Number(targetWeightKgRaw) : null

  if (!name || !age || !sex || !heightCm || !goalType) {
    return { error: 'Please fill in all required fields.' }
  }
  if (age <= 0 || age >= 130 || heightCm <= 0) {
    return { error: 'Please enter realistic values.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      name,
      age,
      sex,
      height_cm: heightCm,
      goal_type: goalType,
      target_weight_kg: targetWeightKg,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/profile')

  return { success: true }
}
