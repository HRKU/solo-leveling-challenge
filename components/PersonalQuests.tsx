import { CalendarDays, CheckCircle2, Clock3, LockKeyhole, Zap } from 'lucide-react'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCheckinDateShort } from '@/lib/date-format'
import type { PersonalQuest } from '@/lib/types'
import { cn } from '@/lib/utils'

type DisplayStatus = PersonalQuest['status']

function displayStatus(quest: PersonalQuest, today: string): DisplayStatus {
  if (quest.status === 'completed') return 'completed'
  if (quest.status === 'expired' || today > quest.ends_on) return 'expired'
  return 'active'
}

const STATUS_LABEL: Record<DisplayStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  expired: 'Expired',
}

function PersonalQuestCard({ quest, today }: { quest: PersonalQuest; today: string }) {
  const status = displayStatus(quest, today)
  const progress = Math.min(quest.progress, quest.target)
  const percentage = quest.target > 0 ? Math.round(progress / quest.target * 100) : 0
  const unit = typeof quest.parameters.unit === 'string'
    ? quest.parameters.unit
    : quest.quest_type === 'checkin_days' || quest.quest_type === 'workout_days' || quest.quest_type === 'habit_target_days'
      ? 'days'
      : quest.quest_type === 'exercise_sessions' ? 'sessions' : ''

  return (
    <Card className={cn(
      'overflow-hidden',
      status === 'completed' && 'border-emerald-500/25 bg-emerald-500/5',
      status === 'expired' && 'opacity-70'
    )}>
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="font-heading text-base">{quest.title}</CardTitle>
            <CardDescription className="mt-1 leading-relaxed">{quest.description}</CardDescription>
          </div>
          {status === 'completed' ? (
            <NoxPixelMascot state="success" decorative className="-my-3 size-14 shrink-0" />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={status === 'active' ? 'default' : 'outline'}
            className={cn(status === 'completed' && 'border-emerald-500/30 text-emerald-400')}
          >
            {status === 'completed' ? <CheckCircle2 data-icon="inline-start" /> : <Clock3 data-icon="inline-start" />}
            {STATUS_LABEL[status]}
          </Badge>
          <Badge variant="secondary">
            <Zap data-icon="inline-start" />
            {quest.xp_reward} XP
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">Progress</span>
            <span className="font-display-num tabular-nums text-muted-foreground">
              {progress} / {quest.target}{unit ? ` ${unit}` : ''}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`${quest.title} progress`}
            aria-valuemin={0}
            aria-valuemax={quest.target}
            aria-valuenow={progress}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn('h-full rounded-full bg-primary', status === 'completed' && 'bg-emerald-400')}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden />
          <span>
            {status === 'expired' ? 'Ended' : status === 'completed' ? 'Completed for week ending' : 'Ends'}{' '}
            {formatCheckinDateShort(quest.ends_on)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function PersonalQuests({ quests, today }: { quests: PersonalQuest[]; today: string }) {
  const ordered = [...quests].sort((a, b) => {
    const order: Record<DisplayStatus, number> = { active: 0, completed: 1, expired: 2 }
    return order[displayStatus(a, today)] - order[displayStatus(b, today)] || b.starts_on.localeCompare(a.starts_on)
  })

  return (
    <section aria-labelledby="personal-quests-title" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="personal-quests-title" className="font-heading text-lg font-bold">Personal Quests</h2>
          <p className="text-sm text-muted-foreground">Private missions shaped by your latest Hunter Report.</p>
        </div>
        <LockKeyhole className="mt-1 size-4 shrink-0 text-muted-foreground" aria-label="Private to you" />
      </div>

      {ordered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 py-5">
            <NoxPixelMascot state="idle" decorative className="size-14 shrink-0" />
            <div>
              <p className="font-heading font-semibold">No personal quests yet</p>
              <p className="text-sm text-muted-foreground">Complete an eligible Weekly Hunter Report to receive your next missions.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {ordered.map((quest) => <PersonalQuestCard key={quest.id} quest={quest} today={today} />)}
        </div>
      )}
    </section>
  )
}
