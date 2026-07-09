'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { createChallenge } from '@/app/actions/challenges'
import { ChallengeCard } from '@/components/ChallengeCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import type { Challenge, ChallengeCompletion, Profile } from '@/lib/types'

export function QuestsList({
  challenges,
  completions,
  members,
  currentUserId,
}: {
  challenges: Challenge[]
  completions: ChallengeCompletion[]
  members: Pick<Profile, 'id' | 'name' | 'display_name'>[]
  currentUserId: string
}) {
  const [state, action, pending] = useActionState(createChallenge, undefined)

  useEffect(() => {
    if (state?.success) toast.success('Quest posted to the group.')
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Post a quest</CardTitle>
          <CardDescription>Free text, group-wide, runs through the end of this month.</CardDescription>
        </CardHeader>
        <form action={action} key={state?.success ? Date.now() : 'form'}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. 50 push-ups in a row" required maxLength={200} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Details — optional</Label>
              <Textarea id="description" name="description" placeholder="Video proof expected, share in the group chat." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="xpReward">Bonus XP</Label>
              <Input id="xpReward" name="xpReward" type="number" inputMode="numeric" min={1} max={1000} defaultValue={50} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={pending} className="w-full" size="lg">
              {pending ? 'Posting...' : 'Post quest'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        {challenges.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No quests posted yet this month.</p>
        )}
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            completedUserIds={completions.filter((c) => c.challenge_id === challenge.id).map((c) => c.user_id)}
            members={members}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  )
}
