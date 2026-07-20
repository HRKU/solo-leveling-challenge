import { createClient, getCurrentUserId } from '@/lib/supabase/server'
import { WeeklyCheckinForm } from '@/components/WeeklyCheckinForm'
import type { Profile } from '@/lib/types'

export default async function WeeklyCheckinPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_weight_kg')
    .eq('id', userId!)
    .single<Pick<Profile, 'current_weight_kg'>>()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-4 pb-8">
      <h1 className="text-xl font-bold sm:text-2xl">Weekly check-in</h1>
      <WeeklyCheckinForm key={profile?.current_weight_kg ?? 'none'} currentWeightKg={profile?.current_weight_kg ?? null} />
    </div>
  )
}
