'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { upsertDailyCheckin } from '@/app/actions/daily-checkins'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import type { DailyCheckin } from '@/lib/types'
import type { DailyTargets } from '@/lib/targets'

export function DailyCheckinForm({
  todayCheckin,
  targets,
}: {
  todayCheckin: DailyCheckin | null
  targets: DailyTargets
}) {
  const [state, action, pending] = useActionState(upsertDailyCheckin, undefined)

  useEffect(() => {
    if (state?.success) toast.success("Today's check-in saved.")
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{todayCheckin ? "Edit today's check-in" : "Today's check-in"}</CardTitle>
        <CardDescription>
          Targets: {targets.waterTarget} ml water · {targets.sleepTarget}h sleep · {targets.stepsTarget} steps ·{' '}
          {targets.proteinTarget}g protein · {targets.calorieTarget} kcal
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="workoutDone" className="flex flex-col items-start gap-0.5">
              <span>Workout done</span>
              <span className="text-xs font-normal text-muted-foreground">Worth the most XP</span>
            </Label>
            <Switch id="workoutDone" name="workoutDone" value="on" defaultChecked={todayCheckin?.workout_done ?? false} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workoutType">Workout type</Label>
              <Input id="workoutType" name="workoutType" placeholder="e.g. Push day" defaultValue={todayCheckin?.workout_type ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="durationMinutes">Duration (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={0}
                defaultValue={todayCheckin?.duration_minutes ?? ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="waterMl">Water (ml)</Label>
              <Input id="waterMl" name="waterMl" type="number" min={0} defaultValue={todayCheckin?.water_ml ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sleepHours">Sleep (hours)</Label>
              <Input
                id="sleepHours"
                name="sleepHours"
                type="number"
                min={0}
                max={24}
                step="0.1"
                defaultValue={todayCheckin?.sleep_hours ?? ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="steps">Steps</Label>
              <Input id="steps" name="steps" type="number" min={0} defaultValue={todayCheckin?.steps ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proteinG">Protein (g)</Label>
              <Input id="proteinG" name="proteinG" type="number" min={0} defaultValue={todayCheckin?.protein_g ?? ''} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="calories">Calories — optional</Label>
            <Input id="calories" name="calories" type="number" min={0} defaultValue={todayCheckin?.calories ?? ''} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="How did today go?" defaultValue={todayCheckin?.notes ?? ''} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Saving...' : todayCheckin ? 'Update check-in' : 'Save check-in'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
