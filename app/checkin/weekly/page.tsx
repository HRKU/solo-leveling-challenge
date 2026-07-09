import { createClient } from '@/lib/supabase/server'
import { WeeklyCheckinForm } from '@/components/WeeklyCheckinForm'
import type { Profile } from '@/lib/types'

export default async function WeeklyCheckinPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_weight_kg')
    .eq('id', user!.id)
    .single<Pick<Profile, 'current_weight_kg'>>()

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-4 pb-16">
      <h1 className="text-2xl font-bold">Weekly check-in</h1>
      <WeeklyCheckinForm key={profile?.current_weight_kg ?? 'none'} currentWeightKg={profile?.current_weight_kg ?? null} />
    </div>
  )
}
