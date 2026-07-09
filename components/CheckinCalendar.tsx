import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format } from 'date-fns'
import { DayCell } from '@/components/DayCell'
import { buildDayHabitBreakdown, type DailyCheckinInput } from '@/lib/xp'
import { Card, CardContent } from '@/components/ui/card'
import type { DailyTargets } from '@/lib/targets'
import type { DailyCheckin } from '@/lib/types'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toDailyCheckinInput(checkin: DailyCheckin): DailyCheckinInput {
  return {
    pushups: checkin.pushups,
    pullups: checkin.pullups,
    situps: checkin.situps,
    crunches: checkin.crunches,
    waterMl: checkin.water_ml,
    sleepHours: checkin.sleep_hours,
    steps: checkin.steps,
    proteinG: checkin.protein_g,
    calories: checkin.calories,
  }
}

export function CheckinCalendar({
  month,
  checkins,
  targets,
}: {
  month: Date
  checkins: DailyCheckin[]
  targets: DailyTargets
}) {
  const checkinsByDate = new Map(checkins.map((c) => [c.checkin_date, c]))
  const today = format(new Date(), 'yyyy-MM-dd')

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // ISO weekday: Monday = 0 ... Sunday = 6, for leading blank cells.
  const leadingBlanks = (getDay(monthStart) + 6) % 7

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-semibold tracking-wide">{format(month, 'MMMM yyyy').toUpperCase()}</h2>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="text-[0.7rem] font-medium text-muted-foreground">
              {label}
            </span>
          ))}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const checkin = checkinsByDate.get(dateStr)
            const breakdown = buildDayHabitBreakdown(
              dateStr,
              checkin ? toDailyCheckinInput(checkin) : null,
              targets
            )
            return (
              <DayCell
                key={dateStr}
                dayNumber={day.getDate()}
                breakdown={breakdown}
                isToday={dateStr === today}
              />
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-emerald-400" /> Hit
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-amber-400" /> Partial
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-muted-foreground/25" /> Miss
          </span>
          <span>Dot size = priority</span>
        </div>
      </CardContent>
    </Card>
  )
}
