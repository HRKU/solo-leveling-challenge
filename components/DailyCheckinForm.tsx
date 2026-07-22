'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { upsertDailyCheckin } from '@/app/actions/daily-checkins'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { DailyEssentials, type DailyEssentialsValues } from '@/components/DailyEssentials'
import { WorkoutLogger } from '@/components/workout/WorkoutLogger'
import type { DailyCheckin } from '@/lib/types'
import type { DailyTargets } from '@/lib/targets'
import { dailyCheckinPayloadSchema } from '@/lib/validation/checkin'
import { hydrateWorkoutEntries, type WorkoutEntry } from '@/lib/workout-logger'
import { formatCheckinDateHeading } from '@/lib/date-format'

export function DailyCheckinForm({
  date,
  isToday,
  checkin,
  targets,
}: {
  date: string
  isToday: boolean
  checkin: DailyCheckin | null
  targets: DailyTargets
}) {
  const [state, action, pending] = useActionState(upsertDailyCheckin, undefined)
  const [entries, setEntries] = useState<WorkoutEntry[]>(() => hydrateWorkoutEntries(checkin))
  const [essentials, setEssentials] = useState<DailyEssentialsValues>(() => ({
    waterMl: checkin?.water_ml ?? null,
    steps: checkin?.steps ?? null,
    proteinG: checkin?.protein_g ?? null,
    calories: checkin?.calories ?? null,
    sleepHours: checkin?.sleep_hours ?? null,
    notes: checkin?.notes ?? '',
  }))

  const workoutJson = useMemo(() => JSON.stringify(entries), [entries])

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
      return
    }
    if (!state?.success) return

    if (state.created) {
      toast.success(isToday ? "Today's check-in saved." : `Check-in for ${date} saved.`)
    } else {
      toast.success(isToday ? "Today's check-in updated." : `Check-in for ${date} updated.`)
    }
  }, [state, date, isToday])

  const titleVerb = checkin ? 'Edit' : 'Log'
  const titleWhen = isToday ? "today's" : formatCheckinDateHeading(date)

  function validateBeforeSubmit(form: HTMLFormElement): boolean {
    const fd = new FormData(form)
    // Mirror hidden fields from React state (controlled).
    fd.set('workoutEntries', workoutJson)
    fd.set('waterMl', essentials.waterMl != null ? String(essentials.waterMl) : '')
    fd.set('sleepHours', essentials.sleepHours != null ? String(essentials.sleepHours) : '')
    fd.set('steps', essentials.steps != null ? String(essentials.steps) : '')
    fd.set('proteinG', essentials.proteinG != null ? String(essentials.proteinG) : '')
    fd.set('calories', essentials.calories != null ? String(essentials.calories) : '')
    fd.set('notes', essentials.notes)

    const candidate = {
      date: (fd.get('date') as string) || undefined,
      waterMl: essentials.waterMl,
      sleepHours: essentials.sleepHours,
      steps: essentials.steps,
      proteinG: essentials.proteinG,
      calories: essentials.calories,
      notes: essentials.notes.trim() ? essentials.notes.trim() : null,
      workoutEntries: entries,
    }
    const parsed = dailyCheckinPayloadSchema.safeParse(candidate)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid check-in data.')
      return false
    }
    return true
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">
          {titleVerb} {titleWhen} check-in
        </CardTitle>
        <CardDescription>
          Targets: {(targets.waterTarget / 1000).toFixed(1)}L water · {targets.sleepTarget}h sleep ·{' '}
          {targets.stepsTarget.toLocaleString()} steps · {targets.proteinTarget}g protein · {targets.calorieTarget}{' '}
          kcal
        </CardDescription>
      </CardHeader>
      <form
        action={action}
        onSubmit={(e) => {
          if (!validateBeforeSubmit(e.currentTarget)) {
            e.preventDefault()
          }
        }}
        className="pb-[env(safe-area-inset-bottom)]"
      >
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="workoutEntries" value={workoutJson} />
        <input type="hidden" name="waterMl" value={essentials.waterMl ?? ''} />
        <input type="hidden" name="sleepHours" value={essentials.sleepHours ?? ''} />
        <input type="hidden" name="steps" value={essentials.steps ?? ''} />
        <input type="hidden" name="proteinG" value={essentials.proteinG ?? ''} />
        <input type="hidden" name="calories" value={essentials.calories ?? ''} />
        <input type="hidden" name="notes" value={essentials.notes} />

        <CardContent className="flex flex-col gap-5">
          <WorkoutLogger entries={entries} onChange={setEntries} />
          <DailyEssentials values={essentials} onChange={setEssentials} targets={targets} />
        </CardContent>
        <CardFooter className="sticky bottom-0 z-10 border-t border-border/40 bg-card/95 pt-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <Button type="submit" disabled={pending} className="min-h-11 w-full" size="lg" aria-busy={pending}>
            {pending ? 'Saving…' : checkin ? 'Update check-in' : 'Save check-in'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
