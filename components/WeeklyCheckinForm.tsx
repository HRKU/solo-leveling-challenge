'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { submitWeeklyCheckin } from '@/app/actions/weekly-checkins'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Scale, Percent } from 'lucide-react'

export function WeeklyCheckinForm({
  currentWeightKg,
  bodyFatPct,
  onSuccess,
  submitLabel = 'Save weekly check-in',
}: {
  currentWeightKg: number | null
  bodyFatPct?: number | null
  onSuccess?: () => void
  submitLabel?: string
}) {
  const [state, action, pending] = useActionState(submitWeeklyCheckin, undefined)

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
      return
    }
    if (!state?.success) return
    toast.success(state.created ? 'Weekly check-in saved.' : 'Weekly check-in updated.')
    onSuccess?.()
  }, [state, onSuccess])

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weightKg" className="flex items-center gap-1.5">
          <Scale className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          Weight (kg)
        </Label>
        <Input
          id="weightKg"
          name="weightKg"
          type="number"
          inputMode="decimal"
          min={1}
          step="0.1"
          defaultValue={currentWeightKg ?? ''}
          required
          className="h-11"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bodyFatPct" className="flex items-center gap-1.5">
          <Percent className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          Body fat % — optional
        </Label>
        <Input
          id="bodyFatPct"
          name="bodyFatPct"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="0.1"
          defaultValue={bodyFatPct ?? ''}
          className="h-11"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}
