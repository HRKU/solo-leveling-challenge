import { createClient, getCurrentUserId } from '@/lib/supabase/server'
import { QuestsList } from '@/components/QuestsList'
import { PersonalQuests } from '@/components/PersonalQuests'
import type { Challenge, ChallengeCompletion, PersonalQuest, Profile } from '@/lib/types'

function currentMonthStart(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

export default async function QuestsPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const startDate = currentMonthStart()

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: personalQuests }, { data: challenges }, { data: completions }, { data: members }] = await Promise.all([
    supabase
      .from('personal_quests')
      .select('id,user_id,source_report_id,quest_type,parameters,title,description,target,progress,starts_on,ends_on,status,xp_reward,completed_at,xp_awarded_at,created_at,updated_at')
      .eq('user_id', userId!)
      .order('starts_on', { ascending: false })
      .limit(24)
      .returns<PersonalQuest[]>(),
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
        <p className="text-sm text-muted-foreground">Your private missions and this month&apos;s group challenges.</p>
      </div>
      <PersonalQuests quests={personalQuests ?? []} today={today} />
      <section aria-labelledby="group-quests-title" className="flex flex-col gap-3">
        <div>
          <h2 id="group-quests-title" className="font-heading text-lg font-bold">Group Quests</h2>
          <p className="text-sm text-muted-foreground">Shared challenges for the whole guild.</p>
        </div>
      <QuestsList
        challenges={challenges ?? []}
        completions={completions ?? []}
        members={members ?? []}
        currentUserId={userId!}
      />
      </section>
    </div>
  )
}
