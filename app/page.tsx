import { createClient } from '@/lib/supabase/server'
import { calculateDailyTargets } from '@/lib/targets'
import { RankBadge } from '@/components/RankBadge'
import { XPBar } from '@/components/XPBar'
import { StreakFlame } from '@/components/StreakFlame'
import { DailyCheckinForm } from '@/components/DailyCheckinForm'
import { Card, CardContent } from '@/components/ui/card'
import type { Profile, DailyCheckin } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single<Profile>()

  const today = new Date().toISOString().slice(0, 10)
  const { data: todayCheckin } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user!.id)
    .eq('checkin_date', today)
    .maybeSingle<DailyCheckin>()

  const targets = calculateDailyTargets({
    age: profile!.age!,
    sex: profile!.sex!,
    heightCm: profile!.height_cm!,
    currentWeightKg: profile!.current_weight_kg!,
    goalType: profile!.goal_type!,
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 pb-8">
      <div>
        <h1 className="font-heading text-xl font-bold sm:text-2xl">
          Welcome back, {profile!.name ?? profile!.display_name}
        </h1>
        <p className="text-sm text-muted-foreground">Keep the streak alive.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <RankBadge rank={profile!.rank} level={profile!.level} size="lg" />
            <StreakFlame streak={profile!.current_streak} />
          </div>
          <XPBar totalXp={profile!.total_xp} />
        </CardContent>
      </Card>

      <DailyCheckinForm key={todayCheckin?.id ?? 'new'} todayCheckin={todayCheckin ?? null} targets={targets} />
    </div>
  )
}
