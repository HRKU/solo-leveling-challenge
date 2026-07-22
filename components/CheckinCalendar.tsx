'use client'

import { useState } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format } from 'date-fns'
import { CalendarCheck, CalendarDays, Sparkles } from 'lucide-react'
import { DayCell } from '@/components/DayCell'
import { CalendarDayModal } from '@/components/CalendarDayModal'
import { StreakFlame } from '@/components/StreakFlame'
import { buildDayHabitBreakdown, type DailyCheckinInput } from '@/lib/xp'
import { isoToLocalDate } from '@/lib/date-format'
import { Card, CardContent } from '@/components/ui/card'
import type { DailyTargets } from '@/lib/targets'
import type { DailyCheckin } from '@/lib/types'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toDailyCheckinInput(checkin: DailyCheckin): DailyCheckinInput {
  return {
    pushups: checkin.pushups,
    pullups: checkin.pullups,
    crunches: checkin.crunches,
    squats: checkin.squats,
    waterMl: checkin.water_ml,
    sleepHours: checkin.sleep_hours,
    steps: checkin.steps,
    proteinG: checkin.protein_g,
    calories: checkin.calories,
  }
}

export function CheckinCalendar({
  monthIso,
  today,
  checkins,
  targets,
  currentStreak,
}: {
  /** Any date within the month to render, as `yyyy-MM-dd`. */
  monthIso: string
  /** Server-computed "today" (`yyyy-MM-dd`) — keeps today/future gating consistent with the rest of the app. */
  today: string
  checkins: DailyCheckin[]
  targets: DailyTargets
  /** Profile's overall streak (not month-scoped) — shown alongside the calendar for context. */
  currentStreak: number
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const checkinsByDate = new Map(checkins.map((c) => [c.checkin_date, c]))
  const month = isoToLocalDate(monthIso)

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // ISO weekday: Monday = 0 ... Sunday = 6, for leading blank cells.
  const leadingBlanks = (getDay(monthStart) + 6) % 7

  // Computed once per render alongside the grid so the day-details modal
  // (opened from a click) reads the exact same breakdown as the dots —
  // workout coloring/XP always comes from the stored check-in data.
  const dayEntries = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const checkin = checkinsByDate.get(dateStr) ?? null
    const breakdown = buildDayHabitBreakdown(
      dateStr,
      checkin ? toDailyCheckinInput(checkin) : null,
      targets,
      checkin
        ? {
            scoringVersion: checkin.scoring_version,
            workoutXpOverride: checkin.score_breakdown?.workoutXp ?? null,
            scoreXp: checkin.score_xp,
          }
        : undefined
    )
    return { day, dateStr, checkin, breakdown }
  })

  const selected = selectedDate ? (dayEntries.find((e) => e.dateStr === selectedDate) ?? null) : null

  // Month-scoped summary — purely presentational, computed from the same
  // `checkins`/`dayEntries` the grid already renders (no extra fetching).
  const daysElapsed = dayEntries.filter((e) => e.dateStr <= today).length
  const loggedCount = checkins.length
  const monthXp = checkins.reduce((sum, c) => sum + c.score_xp, 0)

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0 text-primary" strokeWidth={2} />
              <h2 className="font-heading text-base font-semibold tracking-wide uppercase">
                {format(month, 'MMMM yyyy')}
              </h2>
            </div>
            <StreakFlame streak={currentStreak} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
              <CalendarCheck className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
              <span className="font-display-num font-semibold tabular-nums text-foreground">{loggedCount}</span>
              <span>/ {daysElapsed} days logged</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
              <span className="font-display-num font-semibold tabular-nums text-foreground">{monthXp}</span>
              <span>XP this month</span>
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-7 gap-1 border-b border-border/40 pb-2 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="text-[0.7rem] font-medium text-muted-foreground">
                  {label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {dayEntries.map(({ day, dateStr, breakdown }) => (
                <DayCell
                  key={dateStr}
                  date={dateStr}
                  dayNumber={day.getDate()}
                  breakdown={breakdown}
                  isToday={dateStr === today}
                  isFuture={dateStr > today}
                  onSelectPast={setSelectedDate}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 shrink-0 rounded-full bg-emerald-400" /> Hit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 shrink-0 rounded-full bg-amber-400" /> Partial
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 shrink-0 rounded-full bg-muted-foreground/25" /> Miss
              </span>
            </div>
            <span className="text-[0.7rem] text-muted-foreground/70">Dot size = habit priority</span>
          </div>
        </CardContent>
      </Card>

      <CalendarDayModal
        open={selectedDate != null}
        onClose={() => setSelectedDate(null)}
        date={selectedDate ?? ''}
        checkin={selected?.checkin ?? null}
        breakdown={selected?.breakdown ?? null}
      />
    </>
  )
}
