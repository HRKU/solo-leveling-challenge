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

export function RankBadge({
  rank,
  level,
  className,
}: {
  rank: Rank
  level?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1',
        RANK_STYLES[rank],
        className
      )}
    >
      <span className="text-base font-bold">{rank}</span>
      <span className="opacity-80">Rank</span>
      {level != null && <span className="opacity-60">· Lv {level}</span>}
    </span>
  )
}
