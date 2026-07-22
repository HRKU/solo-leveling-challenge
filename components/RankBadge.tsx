import type { Rank } from '@/lib/xp'
import { cn } from '@/lib/utils'

const RANK_STYLES: Record<Rank, string> = {
  E: 'bg-slate-500/15 text-slate-300 ring-slate-500/40',
  D: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  C: 'bg-blue-500/15 text-blue-300 ring-blue-500/40',
  B: 'bg-violet-500/15 text-violet-300 ring-violet-500/40',
  A: 'bg-orange-500/15 text-orange-300 ring-orange-500/40',
  S: 'bg-red-500/15 text-red-300 ring-red-500/40',
}

const RANK_GLOW: Record<Rank, string> = {
  E: 'shadow-none',
  D: 'shadow-[0_0_20px_-6px] shadow-emerald-500/50',
  C: 'shadow-[0_0_20px_-6px] shadow-blue-500/50',
  B: 'shadow-[0_0_24px_-6px] shadow-violet-500/60',
  A: 'shadow-[0_0_24px_-6px] shadow-orange-500/60',
  S: 'shadow-[0_0_28px_-6px] shadow-red-500/70',
}

/** Rank-tinted hero card background (e.g. dashboard) — same color families as RANK_STYLES. */
export const RANK_HERO_BG: Record<Rank, string> = {
  E: 'from-slate-500/10',
  D: 'from-emerald-500/10',
  C: 'from-blue-500/10',
  B: 'from-violet-500/10',
  A: 'from-orange-500/10',
  S: 'from-red-500/10',
}

/** Rank-tinted XP progress bar gradient — same color families as RANK_STYLES. */
export const RANK_BAR_GRADIENT: Record<Rank, string> = {
  E: 'from-slate-400/70 to-slate-300',
  D: 'from-emerald-500/70 to-emerald-400',
  C: 'from-blue-500/70 to-blue-400',
  B: 'from-violet-500/70 to-violet-400',
  A: 'from-orange-500/70 to-orange-400',
  S: 'from-red-500/70 to-red-400',
}

export function RankBadge({
  rank,
  level,
  size = 'sm',
  className,
}: {
  rank: Rank
  level?: number
  size?: 'sm' | 'lg'
  className?: string
}) {
  if (size === 'lg') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div
          className={cn(
            'flex size-14 shrink-0 items-center justify-center rounded-2xl font-heading text-2xl font-bold ring-2',
            RANK_STYLES[rank],
            RANK_GLOW[rank]
          )}
        >
          {rank}
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-sm font-semibold tracking-wide text-foreground">{rank}-RANK HUNTER</span>
          {level != null && <span className="text-xs text-muted-foreground">Level {level}</span>}
        </div>
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1',
        RANK_STYLES[rank],
        className
      )}
    >
      <span className="font-heading text-base font-bold">{rank}</span>
      <span className="opacity-80">Rank</span>
      {level != null && <span className="opacity-60">· Lv {level}</span>}
    </span>
  )
}
