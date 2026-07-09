import type { SupabaseClient } from '@supabase/supabase-js'
import { levelForTotalXp, rankForLevel } from '@/lib/xp'

/**
 * The single source-of-truth recomputation for profiles.total_xp. Always
 * re-sums every XP source from scratch rather than incrementally adjusting,
 * so a partial failure anywhere can never leave total_xp permanently stale —
 * re-running this (e.g. on the next check-in, or the next quest toggle)
 * self-heals it. Any new XP source must be added to this sum, not given its
 * own incremental update path.
 */
export async function resumTotalXp(supabase: SupabaseClient, userId: string) {
  const [{ data: checkins }, { data: completions }] = await Promise.all([
    supabase.from('daily_checkins').select('score_xp').eq('user_id', userId),
    supabase
      .from('challenge_completions')
      .select('challenges(xp_reward)')
      .eq('user_id', userId)
      .eq('completed', true)
      .returns<{ challenges: { xp_reward: number } | null }[]>(),
  ])

  const checkinXp = (checkins ?? []).reduce((sum, c) => sum + c.score_xp, 0)
  const challengeXp = (completions ?? []).reduce(
    (sum, c) => sum + (c.challenges?.xp_reward ?? 0),
    0
  )

  const totalXp = checkinXp + challengeXp
  const level = levelForTotalXp(totalXp)
  const rank = rankForLevel(level)

  return { totalXp, level, rank }
}
