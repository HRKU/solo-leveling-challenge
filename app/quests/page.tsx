import { createClient } from '@/lib/supabase/server'
import { QuestsList } from '@/components/QuestsList'
import type { Challenge, ChallengeCompletion, Profile } from '@/lib/types'

function currentMonthStart(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

export default async function QuestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const startDate = currentMonthStart()

  const [{ data: challenges }, { data: completions }, { data: members }] = await Promise.all([
    supabase
      .from('challenges')
      .select('*')
      // Safe because start_date is always server-computed to the 1st of the
      // creation month (never a client-supplied custom range) — see
      // app/actions/challenges.ts. If custom date ranges are ever added,
      // this filter needs to become a proper overlap check instead.
      .eq('start_date', startDate)
      .order('created_at', { ascending: false })
      .returns<Challenge[]>(),
    supabase
      .from('challenge_completions')
      .select('*')
      .eq('completed', true)
      .returns<ChallengeCompletion[]>(),
    supabase
      .from('profiles')
      .select('id, name, display_name')
      .eq('onboarded', true)
      .returns<Pick<Profile, 'id' | 'name' | 'display_name'>[]>(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 pb-8">
      <div>
        <h1 className="font-heading text-xl font-bold sm:text-2xl">Quests</h1>
        <p className="text-sm text-muted-foreground">This month&apos;s group dares. Complete one to earn its bonus XP.</p>
      </div>
      <QuestsList
        challenges={challenges ?? []}
        completions={completions ?? []}
        members={members ?? []}
        currentUserId={user!.id}
      />
    </div>
  )
}
