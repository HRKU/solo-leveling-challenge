'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { submitWeeklyCheckin } from '@/app/actions/weekly-checkins'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export function WeeklyCheckinForm({
  currentWeightKg,
}: {
  currentWeightKg: number | null
}) {
  const [state, action, pending] = useActionState(submitWeeklyCheckin, undefined)

  useEffect(() => {
    if (state?.success) toast.success('Weekly check-in saved.')
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly check-in</CardTitle>
        <CardDescription>Log your weight once a week to track progress toward your goal.</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              min={1}
              step="0.1"
              defaultValue={currentWeightKg ?? ''}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bodyFatPct">Body fat % — optional</Label>
            <Input id="bodyFatPct" name="bodyFatPct" type="number" min={0} max={100} step="0.1" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Saving...' : 'Save weekly check-in'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
