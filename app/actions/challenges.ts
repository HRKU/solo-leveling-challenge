'use server'

import { createClient } from '@/lib/supabase/server'
import { resumTotalXp } from '@/lib/xp-resum'
import { revalidatePath } from 'next/cache'

export interface ChallengeFormState {
  error?: string
  success?: boolean
}

function currentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() // 0-indexed
  const start = new Date(Date.UTC(year, month, 1))
  const end = new Date(Date.UTC(year, month + 1, 0)) // day 0 of next month = last day of this month
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

export async function createChallenge(
  _prevState: ChallengeFormState | undefined,
  formData: FormData
): Promise<ChallengeFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const xpRewardRaw = formData.get('xpReward') as string
  const xpReward = xpRewardRaw ? Number(xpRewardRaw) : NaN

  if (!title) {
    return { error: 'Please enter a challenge title.' }
  }
  if (!Number.isFinite(xpReward) || xpReward <= 0 || xpReward > 1000) {
    return { error: 'XP reward must be between 1 and 1000.' }
  }

  const { startDate, endDate } = currentMonthRange()

  const { error } = await supabase.from('challenges').insert({
    creator_id: user.id,
    title,
    description,
    xp_reward: Math.round(xpReward),
    start_date: startDate,
    end_date: endDate,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/quests')

  return { success: true }
}

export async function toggleChallengeCompletion(
  _prevState: ChallengeFormState | undefined,
  formData: FormData
): Promise<ChallengeFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const challengeId = formData.get('challengeId') as string
  // The *next* state to set, sent by the client (it knows its own current
  // toggle state) — not something the client can use to fabricate XP,
  // because the reward amount itself is never read from the client; it's
  // always looked up server-side from the challenges row during resum.
  const nextCompleted = formData.get('completed') === 'true'

  if (!challengeId) {
    return { error: 'Missing challenge.' }
  }

  const { error: upsertError } = await supabase.from('challenge_completions').upsert(
    {
      challenge_id: challengeId,
      user_id: user.id,
      completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
    },
    { onConflict: 'challenge_id,user_id' }
  )

  if (upsertError) {
    return { error: upsertError.message }
  }

  // Self-healing resum — identical philosophy to upsertDailyCheckin: never
  // trust an incremental +xp_reward / -xp_reward adjustment.
  const { totalXp, level, rank } = await resumTotalXp(supabase, user.id)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ total_xp: totalXp, level, rank })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath('/quests')
  revalidatePath('/')
  revalidatePath('/leaderboard')

  return { success: true }
}
