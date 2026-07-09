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
}: {
  date: string
  dayNumber: number
  breakdown: DayHabitBreakdown | null
  isToday: boolean
  isFuture: boolean
}) {
  const hasCheckin = breakdown?.hasCheckin ?? false
  const score = breakdown?.score ?? 0
  const bgOpacity = hasCheckin ? Math.max(score, 8) / 100 : 0

  const content = (
    <>
      <span className="text-xs tabular-nums text-muted-foreground">{dayNumber}</span>
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
    'flex aspect-square flex-col items-center justify-center gap-1 rounded-md border p-1',
    isToday ? 'border-primary' : 'border-transparent',
    !hasCheckin && 'opacity-40',
    !isFuture && 'transition-colors hover:border-primary/50 hover:bg-muted/50'
  )
  const style = hasCheckin
    ? { backgroundColor: `color-mix(in oklch, var(--primary) ${bgOpacity * 60}%, transparent)` }
    : undefined

  if (isFuture) {
    return (
      <div className={className} style={style} title="No check-in">
        {content}
      </div>
    )
  }

  return (
    <Link
      href={`/checkin/${date}`}
      className={className}
      style={style}
      title={hasCheckin ? `Score: ${score} — click to edit` : 'No check-in — click to log'}
    >
      {content}
    </Link>
  )
}
