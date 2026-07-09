'use client'

import { useActionState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { toggleChallengeCompletion } from '@/app/actions/challenges'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import type { Challenge, Profile } from '@/lib/types'
import { Zap } from 'lucide-react'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ChallengeCard({
  challenge,
  completedUserIds,
  members,
  currentUserId,
}: {
  challenge: Challenge
  completedUserIds: string[]
  members: Pick<Profile, 'id' | 'name' | 'display_name'>[]
  currentUserId: string
}) {
  const [state, action, pending] = useActionState(toggleChallengeCompletion, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const completedRef = useRef<HTMLInputElement>(null)
  const isCompleted = completedUserIds.includes(currentUserId)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  const completedMembers = members.filter((m) => completedUserIds.includes(m.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">{challenge.title}</CardTitle>
        {challenge.description && <CardDescription>{challenge.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          <Zap data-icon="inline-start" className="size-3" strokeWidth={2} />
          {challenge.xp_reward} XP
        </Badge>

        {completedMembers.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {completedMembers.map((m) => (
              <span
                key={m.id}
                title={m.name ?? m.display_name}
                className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/30"
              >
                {initials(m.name ?? m.display_name)}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3">
        <Label htmlFor={`complete-${challenge.id}`} className="text-sm">
          {isCompleted ? 'Completed' : 'Mark as done'}
        </Label>
        <form ref={formRef} action={action}>
          <input type="hidden" name="challengeId" value={challenge.id} />
          <input ref={completedRef} type="hidden" name="completed" defaultValue={String(!isCompleted)} />
          <Switch
            id={`complete-${challenge.id}`}
            checked={isCompleted}
            disabled={pending}
            onCheckedChange={(checked) => {
              if (completedRef.current) completedRef.current.value = String(checked)
              formRef.current?.requestSubmit()
            }}
          />
        </form>
      </CardFooter>
    </Card>
  )
}
