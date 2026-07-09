'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Sex, GoalType } from '@/lib/targets'

export interface OnboardingFormState {
  error?: string
}

export async function completeOnboarding(
  _prevState: OnboardingFormState | undefined,
  formData: FormData
) {
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
  const startingWeightKg = Number(formData.get('startingWeightKg'))
  const goalType = formData.get('goalType') as GoalType
  const targetWeightKgRaw = formData.get('targetWeightKg') as string
  const targetWeightKg = targetWeightKgRaw ? Number(targetWeightKgRaw) : null

  if (!name || !age || !sex || !heightCm || !startingWeightKg || !goalType) {
    return { error: 'Please fill in all required fields.' }
  }
  if (age <= 0 || age >= 130 || heightCm <= 0 || startingWeightKg <= 0) {
    return { error: 'Please enter realistic values.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      name,
      age,
      sex,
      height_cm: heightCm,
      starting_weight_kg: startingWeightKg,
      current_weight_kg: startingWeightKg,
      goal_type: goalType,
      target_weight_kg: targetWeightKg,
      onboarded: true,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}
