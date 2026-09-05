'use client'

import { useActionState, useMemo, useState } from 'react'
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
import { NoxPixelMascot } from '@/components/NoxPixelMascot'

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
  const [showCelebration, setShowCelebration] = useState(false)
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

  async function submitCheckin(previousState: Parameters<typeof upsertDailyCheckin>[0], formData: FormData) {
    const nextState = await upsertDailyCheckin(previousState, formData)
    if (nextState.error) {
      toast.error(nextState.error)
      return nextState
    }
    if (!nextState.success) return nextState

    const description = nextState.personalQuestsCompleted
      ? `${nextState.personalQuestsCompleted} personal quest${nextState.personalQuestsCompleted === 1 ? '' : 's'} completed · ${nextState.personalQuestXp ?? 0} bonus XP secured.`
      : nextState.hasWorkout
      ? nextState.created
        ? `${nextState.scoreXp ?? 0} XP secured from this check-in.`
        : 'Your workout and XP have been recalculated.'
      : 'Your daily progress is now up to date.'
    toast.success(
      nextState.created
        ? isToday ? "Today's check-in saved." : `Check-in for ${date} saved.`
        : isToday ? "Today's check-in updated." : `Check-in for ${date} updated.`,
      { description, duration: 4_000 }
    )
    setShowCelebration(true)
    window.setTimeout(() => setShowCelebration(false), 2_400)
    return nextState
  }

  const [state, action, pending] = useActionState(submitCheckin, undefined)

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
    <>
      {showCelebration && state?.success ? (
        <button
          type="button"
          onClick={() => setShowCelebration(false)}
          className="fixed inset-0 z-50 flex w-full flex-col items-center justify-center overflow-hidden bg-background/96 p-6 text-center backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in sm:inset-x-4 sm:top-1/2 sm:bottom-auto sm:mx-auto sm:w-[min(24rem,calc(100%-2rem))] sm:-translate-y-1/2 sm:flex-row sm:justify-start sm:gap-4 sm:rounded-2xl sm:border sm:border-primary/30 sm:bg-popover/95 sm:p-5 sm:text-left sm:shadow-2xl sm:shadow-primary/20 sm:motion-safe:zoom-in-95"
          role="status"
          aria-live="polite"
        >
          <span className="pointer-events-none absolute size-64 rounded-full bg-primary/15 blur-3xl sm:hidden" />
          <span className="pointer-events-none absolute size-36 rounded-full border border-primary/20 motion-safe:animate-ping sm:hidden" />
          <NoxPixelMascot state="success" decorative className="relative size-28 shrink-0 drop-shadow-[0_0_24px_color-mix(in_oklch,var(--primary)_65%,transparent)] sm:size-16" />
          <span className="relative mt-6 sm:mt-0">
            <span className="block font-heading text-xl font-bold tracking-wide text-foreground sm:text-base sm:font-semibold">
              {state.personalQuestsCompleted
                ? state.personalQuestsCompleted === 1 ? 'Personal quest complete!' : 'Personal quests complete!'
                : state.hasWorkout ? 'Workout secured, Hunter!' : 'Check-in secured!'}
            </span>
            <span className="mx-auto mt-2 block max-w-xs text-sm leading-relaxed text-muted-foreground sm:mx-0 sm:mt-1">
              {state.personalQuestsCompleted
                ? `${state.personalQuestsCompleted} quest${state.personalQuestsCompleted === 1 ? '' : 's'} cleared · ${state.personalQuestXp ?? 0} bonus XP secured.`
                : state.hasWorkout && state.created
                ? `${state.scoreXp ?? 0} XP added to your progress.`
                : state.hasWorkout
                  ? 'Your workout and XP are up to date.'
                  : 'Your daily progress is up to date.'}
            </span>
            <span className="mt-4 block text-xs font-medium tracking-wide text-primary sm:mt-2 sm:font-normal sm:tracking-normal">Tap anywhere to continue</span>
          </span>
          <span className="absolute inset-x-0 bottom-0 h-1 bg-primary/20 sm:hidden">
            <span className="block h-full origin-left bg-primary motion-safe:animate-[checkin-success-timer_2.4s_linear_forwards]" />
          </span>
        </button>
      ) : null}
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
            {pending ? (
              <span className="flex items-center gap-2">
                <NoxPixelMascot state="loading" decorative className="-my-2 size-8" />
                Securing check-in...
              </span>
            ) : checkin ? (
              'Update check-in'
            ) : (
              'Save check-in'
            )}
          </Button>
        </CardFooter>
      </form>
      </Card>
    </>
  )
}
