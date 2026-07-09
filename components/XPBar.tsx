import { xpProgressForLevel } from '@/lib/xp'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'

export function XPBar({ totalXp }: { totalXp: number }) {
  const progress = xpProgressForLevel(totalXp)

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
          <ProgressIndicator className="bg-gradient-to-r from-primary/70 to-primary" />
        </ProgressTrack>
      </Progress>
    </div>
  )
}
