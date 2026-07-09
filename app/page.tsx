import { createClient, getCurrentUserId } from '@/lib/supabase/server'
import { calculateDailyTargets } from '@/lib/targets'
import { RankBadge } from '@/components/RankBadge'
import { XPBar } from '@/components/XPBar'
import { StreakFlame } from '@/components/StreakFlame'
import { DailyCheckinForm } from '@/components/DailyCheckinForm'
import { BackfillDatePicker } from '@/components/BackfillDatePicker'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import type { Profile, DailyCheckin } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const today = new Date().toISOString().slice(0, 10)
  const [{ data: profile }, { data: todayCheckin }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId!).single<Profile>(),
    supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId!)
      .eq('checkin_date', today)
      .maybeSingle<DailyCheckin>(),
  ])

  const targets = calculateDailyTargets({
    age: profile!.age!,
    sex: profile!.sex!,
    heightCm: profile!.height_cm!,
    currentWeightKg: profile!.current_weight_kg!,
    goalType: profile!.goal_type!,
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl">
            Welcome back, {profile!.name ?? profile!.display_name}
          </h1>
          <p className="text-sm text-muted-foreground">Keep the streak alive.</p>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-3.5" strokeWidth={2} />
          Edit profile
        </Link>
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

      <DailyCheckinForm
        key={todayCheckin?.id ?? 'new'}
        date={today}
        isToday
        checkin={todayCheckin ?? null}
        targets={targets}
      />

      <BackfillDatePicker />
    </div>
  )
}
