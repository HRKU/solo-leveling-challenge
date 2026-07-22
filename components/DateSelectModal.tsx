'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { formatCheckinDateHeading, isoToLocalDate, localDateToIso, todayIsoDate } from '@/lib/date-format'

type DateSelectModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (isoDate: string) => void
  initialDate: string
  title?: string
  description?: string
}

/**
 * Mobile-first date picker: a modal with a full calendar grid, a prominent
 * preview of the pending selection, and an explicit Continue action. Never
 * navigates/confirms on its own — only `onConfirm` (Continue) does, so a tap
 * that merely opens the calendar or selects a day can't trigger navigation.
 */
export function DateSelectModal({ open, ...rest }: DateSelectModalProps) {
  if (!open) return null
  // Keyed on the starting date so each time the modal is (re)opened it mounts
  // fresh and seeds `pendingDate` from the latest `initialDate` via useState's
  // initializer — no reset-on-open effect required.
  return <DateSelectModalContent key={rest.initialDate} {...rest} />
}

function DateSelectModalContent({
  onClose,
  onConfirm,
  initialDate,
  title = 'Select a date',
  description,
}: Omit<DateSelectModalProps, 'open'>) {
  const [pendingDate, setPendingDate] = useState(initialDate)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (typeof document === 'undefined') return null

  const today = isoToLocalDate(todayIsoDate())
  const selectedDate = isoToLocalDate(pendingDate)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex w-full max-w-sm flex-col rounded-2xl border border-border/80 bg-background p-4 shadow-2xl"
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold tracking-wide">{title}</h2>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-4" strokeWidth={2} />
          </Button>
        </div>
        {description && <p className="mb-3 text-sm text-muted-foreground">{description}</p>}

        <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2.5">
          <CalendarDays className="size-4 shrink-0 text-primary" strokeWidth={2} />
          <p className="font-heading text-sm font-semibold tracking-wide text-foreground">
            {formatCheckinDateHeading(pendingDate)}
          </p>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            if (date) setPendingDate(localDateToIso(date))
          }}
          disabled={{ after: today }}
          className="mx-auto"
        />

        <div className="mt-2 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={() => onConfirm(pendingDate)}>
            Continue
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
