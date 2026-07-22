import { RankBadge, RANK_HERO_BG } from '@/components/RankBadge'
import { StreakFlame } from '@/components/StreakFlame'
import { XPBar } from '@/components/XPBar'
import { cn } from '@/lib/utils'
import type { Rank } from '@/lib/xp'

/**
 * Dashboard's rank/level/streak hero — same "tinted rounded-2xl section"
 * language as the Leaderboard champion card and the Progress hero, instead
 * of a flat `<Card>`. Background tint and XP bar gradient both key off the
 * hunter's current rank (RANK_HERO_BG / RANK_BAR_GRADIENT in RankBadge.tsx),
 * so the card gets visually richer as someone ranks up.
 */
export function DashboardHero({
  rank,
  level,
  totalXp,
  currentStreak,
}: {
  rank: Rank
  level: number
  totalXp: number
  currentStreak: number
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border/60 bg-gradient-to-b to-background px-4 py-5 sm:px-6 sm:py-6',
        RANK_HERO_BG[rank]
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <RankBadge rank={rank} level={level} size="lg" />
          <StreakFlame streak={currentStreak} />
        </div>
        <XPBar totalXp={totalXp} rank={rank} />
      </div>
    </section>
  )
}
