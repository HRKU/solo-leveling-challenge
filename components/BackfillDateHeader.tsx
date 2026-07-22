'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateSelectModal } from '@/components/DateSelectModal'
import { formatCheckinDateHeading } from '@/lib/date-format'

/** Prominent "which day am I logging" heading for the backfill screen, with a
 * one-tap way to switch dates without leaving the page. */
export function BackfillDateHeader({ date }: { date: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-heading text-xl font-bold sm:text-2xl">Logging {formatCheckinDateHeading(date)}</h1>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
          <Pencil className="size-3.5" strokeWidth={2} />
          Change date
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">This won&apos;t affect your streak — it only counts toward total XP.</p>

      <DateSelectModal
        open={open}
        onClose={() => setOpen(false)}
        initialDate={date}
        title="Change date"
        onConfirm={(newDate) => {
          setOpen(false)
          if (newDate !== date) router.push(`/checkin/${newDate}`)
        }}
      />
    </div>
  )
}
