import { xpProgressForLevel, type Rank } from '@/lib/xp'
import { RANK_BAR_GRADIENT } from '@/components/RankBadge'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function XPBar({ totalXp, rank }: { totalXp: number; rank: Rank }) {
  const progress = xpProgressForLevel(totalXp)
  const xpToNext = progress.xpNeededForNextLevel - progress.xpIntoLevel

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-heading font-semibold tracking-wide">LEVEL {progress.level}</span>
        <span className="font-display-num tabular-nums text-muted-foreground">
          {progress.xpIntoLevel} / {progress.xpNeededForNextLevel} XP
        </span>
      </div>
      <Progress value={progress.progressPercent}>
        <ProgressTrack className="h-2.5">
          <ProgressIndicator className={cn('bg-gradient-to-r', RANK_BAR_GRADIENT[rank])} />
        </ProgressTrack>
      </Progress>
      <p className="text-xs text-muted-foreground">
        {xpToNext} XP to Level {progress.level + 1}
      </p>
    </div>
  )
}
