import { cn } from '@/lib/utils'

export function StreakFlame({ streak, className }: { streak: number; className?: string }) {
  const isActive = streak > 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1',
        isActive ? 'bg-amber-500/15 text-amber-300 ring-amber-500/40' : 'bg-muted text-muted-foreground ring-border',
        className
      )}
    >
      <span aria-hidden>🔥</span>
      <span>
        {streak} day{streak === 1 ? '' : 's'}
      </span>
    </span>
  )
}
