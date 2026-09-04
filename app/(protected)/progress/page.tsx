import { createClient, getCurrentUserId } from '@/lib/supabase/server'
import { BodyProgress } from '@/components/BodyProgress'
import { currentWeekStartDate } from '@/lib/week'
import type { Profile, WeeklyCheckin } from '@/lib/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()
  const thisWeekStart = currentWeekStartDate()

  const [{ data: profile }, { data: checkins }] = await Promise.all([
    supabase
      .from('profiles')
      .select('starting_weight_kg, current_weight_kg, target_weight_kg, goal_type')
      .eq('id', userId!)
      .single<
        Pick<Profile, 'starting_weight_kg' | 'current_weight_kg' | 'target_weight_kg' | 'goal_type'>
      >(),
    supabase
      .from('weekly_checkins')
      .select('*')
      .eq('user_id', userId!)
      .order('week_start_date', { ascending: true })
      .returns<WeeklyCheckin[]>(),
  ])

  const rows = checkins ?? []
  const thisWeekCheckin = rows.find((c) => c.week_start_date === thisWeekStart) ?? null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 pb-8">
      <h1 className="sr-only">Progress</h1>
      <BodyProgress
        checkins={rows}
        currentWeightKg={profile?.current_weight_kg ?? null}
        startingWeightKg={profile?.starting_weight_kg ?? null}
        targetWeightKg={profile?.target_weight_kg ?? null}
        goalType={profile?.goal_type ?? null}
        thisWeekStart={thisWeekStart}
        thisWeekCheckin={thisWeekCheckin}
      />
    </div>
  )
}
