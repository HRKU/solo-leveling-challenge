import { createClient, getCurrentUserId } from '@/lib/supabase/server'
import { calculateDailyTargets } from '@/lib/targets'
import { DailyCheckinForm } from '@/components/DailyCheckinForm'
import { notFound, redirect } from 'next/navigation'
import type { Profile, DailyCheckin } from '@/lib/types'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidCalendarDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false
  const parsed = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

export default async function BackfillCheckinPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params

  if (!isValidCalendarDate(date)) {
    notFound()
  }

  const today = new Date().toISOString().slice(0, 10)
  if (date > today) {
    redirect('/')
  }

  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const [{ data: profile }, { data: checkin }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId!).single<Profile>(),
    supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId!)
      .eq('checkin_date', date)
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
      <div>
        <h1 className="font-heading text-xl font-bold sm:text-2xl">Backfill a check-in</h1>
        <p className="text-sm text-muted-foreground">
          This won&apos;t affect your streak — it only counts toward total XP.
        </p>
      </div>

      <DailyCheckinForm
        key={checkin?.id ?? 'new'}
        date={date}
        isToday={date === today}
        checkin={checkin ?? null}
        targets={targets}
      />
    </div>
  )
}
