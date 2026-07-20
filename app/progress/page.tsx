import { createClient, getCurrentUserId } from '@/lib/supabase/server'
import { WeightTrendChart } from '@/components/WeightTrendChart'
import type { Profile, WeeklyCheckin } from '@/lib/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const [{ data: profile }, { data: checkins }] = await Promise.all([
    supabase
      .from('profiles')
      .select('starting_weight_kg, target_weight_kg, goal_type')
      .eq('id', userId!)
      .single<Pick<Profile, 'starting_weight_kg' | 'target_weight_kg' | 'goal_type'>>(),
    supabase
      .from('weekly_checkins')
      .select('*')
      .eq('user_id', userId!)
      .order('week_start_date', { ascending: true })
      .returns<WeeklyCheckin[]>(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 pb-8">
      <h1 className="text-xl font-bold sm:text-2xl">Your progress</h1>
      <WeightTrendChart
        checkins={checkins ?? []}
        startingWeightKg={profile?.starting_weight_kg ?? null}
        targetWeightKg={profile?.target_weight_kg ?? null}
      />
    </div>
  )
}
