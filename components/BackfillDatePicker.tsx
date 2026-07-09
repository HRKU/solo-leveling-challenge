'use client'

import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarClock } from 'lucide-react'

export function BackfillDatePicker() {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3.5">
      <CalendarClock className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      <Label htmlFor="backfill-date" className="flex-1 text-sm text-muted-foreground">
        Missed a day? Log it here
      </Label>
      <Input
        id="backfill-date"
        type="date"
        max={today}
        className="w-auto"
        onChange={(e) => {
          if (e.target.value) router.push(`/checkin/${e.target.value}`)
        }}
      />
    </div>
  )
}
