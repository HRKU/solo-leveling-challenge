import { createClient } from '@/lib/supabase/server'
import { Leaderboard } from '@/components/Leaderboard'
import type { Profile } from '@/lib/types'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('onboarded', true)
    .order('total_xp', { ascending: false })
    .returns<Profile[]>()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pb-16">
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      <Leaderboard profiles={profiles ?? []} currentUserId={user!.id} />
    </div>
  )
}
