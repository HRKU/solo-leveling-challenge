import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { DayHabitBreakdown, HabitStatus } from '@/lib/xp'

const DOT_STATUS_CLASSES: Record<HabitStatus, string> = {
  hit: 'bg-emerald-400',
  partial: 'bg-amber-400',
  miss: 'bg-muted-foreground/25',
}

// Priority 1 (workout) is largest/most prominent, priority 4 (nutrition) is
// smallest/least prominent — the visual weight mirrors the point weights.
const PRIORITY_SIZE_CLASSES: Record<number, string> = {
  1: 'size-2.5',
  2: 'size-2',
  3: 'size-1.5',
  4: 'size-1',
}

export function DayCell({
  date,
  dayNumber,
  breakdown,
  isToday,
  isFuture,
  onSelectPast,
}: {
  date: string
  dayNumber: number
  breakdown: DayHabitBreakdown | null
  isToday: boolean
  isFuture: boolean
  /** Called for past (non-today) dates — opens the day-details/backfill modal instead of navigating directly. */
  onSelectPast: (date: string) => void
}) {
  const hasCheckin = breakdown?.hasCheckin ?? false
  const score = breakdown?.score ?? 0
  const bgOpacity = hasCheckin ? Math.max(score, 8) / 100 : 0

  const content = (
    <>
      <span className={cn('text-xs tabular-nums', isToday ? 'font-bold text-foreground' : 'font-medium text-foreground/70')}>
        {dayNumber}
      </span>
      {hasCheckin && (
        <div className="flex items-center gap-0.5">
          {breakdown!.habits.map((habit) => (
            <span
              key={habit.key}
              className={cn('rounded-full', PRIORITY_SIZE_CLASSES[habit.priority], DOT_STATUS_CLASSES[habit.status])}
              title={`${habit.label}: ${habit.status}`}
            />
          ))}
        </div>
      )}
    </>
  )

  const className = cn(
    'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-border/60 p-1 select-none',
    isToday && 'ring-2 ring-inset ring-primary',
    !hasCheckin && 'opacity-40',
    isFuture && 'cursor-not-allowed',
    !isFuture && 'transition hover:border-primary/50 hover:bg-muted/50 active:scale-95'
  )
  const style = hasCheckin
    ? { backgroundColor: `color-mix(in oklch, var(--primary) ${bgOpacity * 60}%, transparent)` }
    : undefined

  if (isFuture) {
    return (
      <div className={className} style={style} title="No check-in — future date" aria-disabled="true">
        {content}
      </div>
    )
  }

  // Today always jumps straight to its check-in (same page the dashboard
  // uses) — no confirmation modal in the way of logging today.
  if (isToday) {
    return (
      <Link
        href={`/checkin/${date}`}
        className={className}
        style={style}
        title={hasCheckin ? `Score: ${score} — today's check-in` : "Today — log your check-in"}
      >
        {content}
      </Link>
    )
  }

  // Past dates open a modal first (backfill confirm, or a day-details
  // review) instead of navigating immediately.
  return (
    <button
      type="button"
      onClick={() => onSelectPast(date)}
      className={className}
      style={style}
      title={hasCheckin ? `Score: ${score} — click to view` : 'No check-in — click to log'}
    >
      {content}
    </button>
  )
}
