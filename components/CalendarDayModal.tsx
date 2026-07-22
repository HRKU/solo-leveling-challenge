'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import {
  Beef,
  CalendarDays,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Moon,
  NotebookPen,
  Pencil,
  Sparkles,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatWater, waterUnit, formatSleep } from '@/components/DailyEssentials'
import { formatFullCheckinDate } from '@/lib/date-format'
import { getExerciseById } from '@/lib/exercise-catalog'
import { hydrateWorkoutEntries, summarizeEntry } from '@/lib/workout-logger'
import type { DayHabitBreakdown } from '@/lib/xp'
import type { DailyCheckin } from '@/lib/types'

/**
 * Calendar day interaction surface for past dates:
 * - No check-in yet -> a confirm dialog ("Log this day" / "Cancel").
 * - Existing check-in -> a read-only breakdown of everything logged, plus
 *   "Edit check-in". Navigation to `/checkin/[date]` only ever happens from
 *   an explicit button tap here, never from opening/viewing the modal.
 *
 * `breakdown` is the same `DayHabitBreakdown` the calendar dots use (built
 * from `score_breakdown.workoutXp` for v2/v3 rows) — reused here so the
 * completed/partial read and the dot colors can never disagree.
 */
export function CalendarDayModal({
  open,
  onClose,
  date,
  checkin,
  breakdown,
}: {
  open: boolean
  onClose: () => void
  date: string
  checkin: DailyCheckin | null
  breakdown: DayHabitBreakdown | null
}) {
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !date || typeof document === 'undefined') return null

  function goToCheckin() {
    onClose()
    router.push(`/checkin/${date}`)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={formatFullCheckinDate(date)}
        className="relative z-10 flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl"
      >
        {checkin ? (
          <DayDetails checkin={checkin} breakdown={breakdown} date={date} onClose={onClose} onEdit={goToCheckin} />
        ) : (
          <NoCheckinPrompt date={date} onClose={onClose} onLog={goToCheckin} />
        )}
      </div>
    </div>,
    document.body
  )
}

function NoCheckinPrompt({ date, onClose, onLog }: { date: string; onClose: () => void; onLog: () => void }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold tracking-wide">Log a check-in</h2>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
          <X className="size-4" strokeWidth={2} />
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2.5">
        <CalendarDays className="size-4 shrink-0 text-primary" strokeWidth={2} />
        <p className="font-heading text-sm font-semibold tracking-wide text-foreground">{formatFullCheckinDate(date)}</p>
      </div>

      <p className="text-sm text-muted-foreground">
        No check-in for this date yet. Logging it now is a backfill — it counts toward total XP but won&apos;t touch your
        streak.
      </p>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" className="flex-1" onClick={onLog}>
          Log this day
        </Button>
      </div>
    </div>
  )
}

function EssentialStat({ icon: Icon, label, value, unit }: { icon: LucideIcon; label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="font-heading text-base font-semibold tracking-wide tabular-nums">{value}</span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </span>
    </div>
  )
}

function DayDetails({
  checkin,
  breakdown,
  date,
  onClose,
  onEdit,
}: {
  checkin: DailyCheckin
  breakdown: DayHabitBreakdown | null
  date: string
  onClose: () => void
  onEdit: () => void
}) {
  const entries = hydrateWorkoutEntries(checkin)
  const allHit = breakdown != null && breakdown.habits.every((h) => h.status === 'hit')
  const statusLabel = allHit ? 'Completed log' : 'Partial log'

  return (
    <>
      <div className="flex items-start justify-between gap-2 p-4 pb-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-primary" strokeWidth={2} />
            <p className="font-heading text-sm font-semibold tracking-wide text-foreground">{formatFullCheckinDate(date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={allHit ? 'default' : 'secondary'}>{statusLabel}</Badge>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3" />
              {checkin.score_xp} XP
            </span>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
          <X className="size-4" strokeWidth={2} />
        </Button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
        <section className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Dumbbell className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
            Workout
          </div>
          {entries.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {entries.map((entry) => {
                const ex = getExerciseById(entry.exerciseId)
                return (
                  <li key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{ex?.name ?? entry.exerciseId}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{summarizeEntry(entry, ex)}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No workout logged.</p>
          )}
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <EssentialStat icon={Droplets} label="Water" value={formatWater(checkin.water_ml)} unit={waterUnit(checkin.water_ml)} />
          <EssentialStat
            icon={Footprints}
            label="Steps"
            value={checkin.steps != null && checkin.steps > 0 ? checkin.steps.toLocaleString() : '—'}
            unit="steps"
          />
          <EssentialStat
            icon={Beef}
            label="Protein"
            value={checkin.protein_g != null && checkin.protein_g > 0 ? String(checkin.protein_g) : '—'}
            unit="g"
          />
          <EssentialStat
            icon={Flame}
            label="Calories"
            value={checkin.calories != null && checkin.calories > 0 ? checkin.calories.toLocaleString() : '—'}
            unit="kcal"
          />
          <EssentialStat
            icon={Moon}
            label="Sleep"
            value={formatSleep(checkin.sleep_hours)}
            unit={checkin.sleep_hours != null && checkin.sleep_hours > 0 ? 'h' : ''}
          />
        </section>

        {checkin.notes && (
          <section className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <NotebookPen className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
              Notes
            </div>
            <p className="text-sm whitespace-pre-wrap text-foreground/90">{checkin.notes}</p>
          </section>
        )}
      </div>

      <div className="flex gap-2 border-t border-border/40 p-4 pt-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Close
        </Button>
        <Button type="button" className="flex-1" onClick={onEdit}>
          <Pencil className="size-4" strokeWidth={2} />
          Edit check-in
        </Button>
      </div>
    </>
  )
}
