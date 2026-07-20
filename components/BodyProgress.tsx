'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { TrendingDown, TrendingUp, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WeeklyCheckinForm } from '@/components/WeeklyCheckinForm'
import { WeightTrendChart } from '@/components/WeightTrendChart'
import { formatWeekLabel } from '@/lib/week'
import type { GoalType } from '@/lib/targets'
import type { WeeklyCheckin } from '@/lib/types'
import { cn } from '@/lib/utils'

function WeighInModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex w-full max-w-sm flex-col rounded-2xl border border-border/80 bg-background p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold tracking-wide">{title}</h2>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-4" strokeWidth={2} />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

function deltaIsFavorable(delta: number, goalType: GoalType | null): boolean {
  if (delta === 0) return true
  if (goalType === 'lose') return delta < 0
  if (goalType === 'gain') return delta > 0
  return true
}

function signalClass(delta: number, goalType: GoalType | null): string {
  if (delta === 0) return 'text-muted-foreground'
  return deltaIsFavorable(delta, goalType) ? 'text-emerald-400' : 'text-red-400'
}

export function BodyProgress({
  checkins,
  currentWeightKg,
  startingWeightKg,
  targetWeightKg,
  goalType,
  thisWeekStart,
  thisWeekCheckin,
}: {
  checkins: WeeklyCheckin[]
  currentWeightKg: number | null
  startingWeightKg: number | null
  targetWeightKg: number | null
  goalType: GoalType | null
  thisWeekStart: string
  thisWeekCheckin: WeeklyCheckin | null
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const closeModal = useCallback(() => setModalOpen(false), [])

  const displayWeight = currentWeightKg ?? thisWeekCheckin?.weight_kg ?? startingWeightKg
  const delta =
    displayWeight != null && startingWeightKg != null ? displayWeight - startingWeightKg : null
  const DeltaIcon = delta == null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown
  const loggedThisWeek = thisWeekCheckin != null

  const formWeight = thisWeekCheckin?.weight_kg ?? currentWeightKg
  const formBodyFat = thisWeekCheckin?.body_fat_pct ?? null

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-background px-5 py-8 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.45_0.12_280_/0.18),transparent_60%)]"
        />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <p className="font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Body progress
          </p>
          <div className="flex flex-col items-center gap-1">
            <p className="font-display-num text-5xl font-bold tracking-tight tabular-nums sm:text-6xl">
              {displayWeight != null ? displayWeight.toFixed(1) : '—'}
            </p>
            <p className="text-sm text-muted-foreground">kg · current</p>
          </div>

          {delta != null ? (
            <p className={cn('flex items-center gap-1.5 text-sm', signalClass(delta, goalType))}>
              <DeltaIcon className="size-4 shrink-0" strokeWidth={2} />
              <span className="font-display-num font-semibold tabular-nums">
                {delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`}
              </span>
              <span className="text-muted-foreground">from start</span>
              {targetWeightKg != null && (
                <span className="text-muted-foreground">· target {targetWeightKg} kg</span>
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Log your first weekly weigh-in to start the trend.
            </p>
          )}

          <div className="flex flex-col items-center gap-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Week of {formatWeekLabel(thisWeekStart)}
              {loggedThisWeek ? ' · logged' : ' · not logged yet'}
            </p>
            <Button type="button" size="lg" className="min-w-[12rem]" onClick={() => setModalOpen(true)}>
              {loggedThisWeek ? 'Update this week' : 'Log this week'}
            </Button>
          </div>
        </div>
      </section>

      <WeightTrendChart
        checkins={checkins}
        startingWeightKg={startingWeightKg}
        targetWeightKg={targetWeightKg}
        goalType={goalType}
        hideEmptyCard
      />

      <WeighInModal
        open={modalOpen}
        onClose={closeModal}
        title={loggedThisWeek ? 'Update this week' : 'Log this week'}
      >
        <p className="mb-3 text-sm text-muted-foreground">
          Week of {formatWeekLabel(thisWeekStart)}. Weight updates your daily targets.
        </p>
        <WeeklyCheckinForm
          key={`${formWeight}-${formBodyFat}-${modalOpen}`}
          currentWeightKg={formWeight}
          bodyFatPct={formBodyFat}
          onSuccess={closeModal}
          submitLabel={loggedThisWeek ? 'Update weigh-in' : 'Save weigh-in'}
        />
      </WeighInModal>
    </div>
  )
}
