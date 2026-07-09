import { createClient } from '@/lib/supabase/server'
import { WeightTrendChart } from '@/components/WeightTrendChart'
import type { Profile, WeeklyCheckin } from '@/lib/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('starting_weight_kg, target_weight_kg, goal_type')
    .eq('id', user!.id)
    .single<Pick<Profile, 'starting_weight_kg' | 'target_weight_kg' | 'goal_type'>>()

  const { data: checkins } = await supabase
    .from('weekly_checkins')
    .select('*')
    .eq('user_id', user!.id)
    .order('week_start_date', { ascending: true })
    .returns<WeeklyCheckin[]>()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pb-16">
      <h1 className="text-2xl font-bold">Your progress</h1>
      <WeightTrendChart
        checkins={checkins ?? []}
        startingWeightKg={profile?.starting_weight_kg ?? null}
        targetWeightKg={profile?.target_weight_kg ?? null}
      />
    </div>
  )
}
