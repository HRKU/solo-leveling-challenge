'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { DateSelectModal } from '@/components/DateSelectModal'
import { yesterdayIsoDate } from '@/lib/date-format'

export function BackfillDatePicker() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/50 active:bg-muted/60"
      >
        <CalendarClock className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        <span className="flex-1 text-sm text-muted-foreground">Missed a day? Log it here</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      </button>

      <DateSelectModal
        open={open}
        onClose={() => setOpen(false)}
        initialDate={yesterdayIsoDate()}
        title="Log a past day"
        description="This won't affect your streak — it only counts toward total XP."
        onConfirm={(date) => {
          setOpen(false)
          router.push(`/checkin/${date}`)
        }}
      />
    </>
  )
}
