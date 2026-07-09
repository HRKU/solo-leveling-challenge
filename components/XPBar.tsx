import { xpProgressForLevel } from '@/lib/xp'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'

export function XPBar({ totalXp }: { totalXp: number }) {
  const progress = xpProgressForLevel(totalXp)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">Level {progress.level}</span>
        <span className="text-muted-foreground tabular-nums">
          {progress.xpIntoLevel} / {progress.xpNeededForNextLevel} XP to next level
        </span>
      </div>
      <Progress value={progress.progressPercent}>
        <ProgressTrack className="h-2">
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
    </div>
  )
}
