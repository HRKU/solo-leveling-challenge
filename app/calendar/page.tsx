import { startOfMonth, endOfMonth, format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { calculateDailyTargets } from '@/lib/targets'
import { CheckinCalendar } from '@/components/CheckinCalendar'
import type { Profile, DailyCheckin } from '@/lib/types'

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single<Profile>()

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  const { data: checkins } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user!.id)
    .gte('checkin_date', monthStart)
    .lte('checkin_date', monthEnd)
    .returns<DailyCheckin[]>()

  const targets = calculateDailyTargets({
    age: profile!.age!,
    sex: profile!.sex!,
    heightCm: profile!.height_cm!,
    currentWeightKg: profile!.current_weight_kg!,
    goalType: profile!.goal_type!,
  })

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pb-16">
      <h1 className="text-2xl font-bold">Habit calendar</h1>
      <CheckinCalendar month={now} checkins={checkins ?? []} targets={targets} />
    </div>
  )
}
