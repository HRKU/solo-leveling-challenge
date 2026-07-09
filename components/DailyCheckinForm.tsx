'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { upsertDailyCheckin } from '@/app/actions/daily-checkins'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import type { DailyCheckin } from '@/lib/types'
import type { DailyTargets } from '@/lib/targets'
import { REP_WEIGHTS, REP_REFERENCE } from '@/lib/xp'
import { Dumbbell, Clock, Droplets, Moon, Footprints, Beef, Flame, NotebookPen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function FieldLabel({ icon: Icon, htmlFor, children }: { icon: LucideIcon; htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="size-3.5 shrink-0" strokeWidth={2} />
      <span className="text-foreground">{children}</span>
    </Label>
  )
}

function RepField({
  id,
  label,
  weight,
  suggested,
  defaultValue,
}: {
  id: string
  label: string
  weight: number
  suggested: number
  defaultValue: number | null | undefined
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="whitespace-nowrap">
        {label}
      </Label>
      <span className="text-xs font-normal text-muted-foreground">
        {weight} pt/rep · try {suggested}+
      </span>
      <Input id={id} name={id} type="number" inputMode="numeric" min={0} defaultValue={defaultValue ?? ''} />
    </div>
  )
}

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
        <CardTitle className="font-heading">{todayCheckin ? "Edit today's check-in" : "Today's check-in"}</CardTitle>
        <CardDescription>
          Targets: {(targets.waterTarget / 1000).toFixed(1)}L water · {targets.sleepTarget}h sleep · {targets.stepsTarget} steps ·{' '}
          {targets.proteinTarget}g protein · {targets.calorieTarget} kcal
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3.5">
            <div className="flex items-center gap-2">
              <Dumbbell className="size-4 shrink-0 text-primary" strokeWidth={2} />
              <span className="font-medium">Reps — worth the most XP, no cap</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <RepField
                id="pushups"
                label="Push-ups"
                weight={REP_WEIGHTS.pushups}
                suggested={REP_REFERENCE.pushups}
                defaultValue={todayCheckin?.pushups}
              />
              <RepField
                id="pullups"
                label="Pull-ups"
                weight={REP_WEIGHTS.pullups}
                suggested={REP_REFERENCE.pullups}
                defaultValue={todayCheckin?.pullups}
              />
              <RepField
                id="situps"
                label="Sit-ups"
                weight={REP_WEIGHTS.situps}
                suggested={REP_REFERENCE.situps}
                defaultValue={todayCheckin?.situps}
              />
              <RepField
                id="crunches"
                label="Crunches"
                weight={REP_WEIGHTS.crunches}
                suggested={REP_REFERENCE.crunches}
                defaultValue={todayCheckin?.crunches}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={Dumbbell} htmlFor="workoutType">
                Other activity — optional
              </FieldLabel>
              <Input id="workoutType" name="workoutType" placeholder="e.g. 5k run" defaultValue={todayCheckin?.workout_type ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={Clock} htmlFor="durationMinutes">
                Duration (min)
              </FieldLabel>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={todayCheckin?.duration_minutes ?? ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={Droplets} htmlFor="waterLiters">Water (L)</FieldLabel>
              <Input
                id="waterLiters"
                name="waterLiters"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                defaultValue={todayCheckin?.water_ml != null ? todayCheckin.water_ml / 1000 : ''}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={Moon} htmlFor="sleepHours">Sleep (hours)</FieldLabel>
              <Input
                id="sleepHours"
                name="sleepHours"
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step="0.1"
                defaultValue={todayCheckin?.sleep_hours ?? ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={Footprints} htmlFor="steps">Steps</FieldLabel>
              <Input id="steps" name="steps" type="number" inputMode="numeric" min={0} defaultValue={todayCheckin?.steps ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel icon={Beef} htmlFor="proteinG">Protein (g)</FieldLabel>
              <Input id="proteinG" name="proteinG" type="number" inputMode="numeric" min={0} defaultValue={todayCheckin?.protein_g ?? ''} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel icon={Flame} htmlFor="calories">Calories — optional</FieldLabel>
            <Input id="calories" name="calories" type="number" inputMode="numeric" min={0} defaultValue={todayCheckin?.calories ?? ''} />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel icon={NotebookPen} htmlFor="notes">Notes</FieldLabel>
            <Textarea id="notes" name="notes" placeholder="How did today go?" defaultValue={todayCheckin?.notes ?? ''} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending ? 'Saving...' : todayCheckin ? 'Update check-in' : 'Save check-in'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
