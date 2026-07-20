'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Beef, Droplets, Flame, Footprints, Moon, NotebookPen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CHECKIN_LIMITS } from '@/lib/validation/checkin'
import type { DailyTargets } from '@/lib/targets'
import { cn } from '@/lib/utils'

export interface DailyEssentialsValues {
  waterMl: number | null
  steps: number | null
  proteinG: number | null
  calories: number | null
  sleepHours: number | null
  notes: string
}

type MetricKey = 'water' | 'steps' | 'protein' | 'calories' | 'sleep'

function formatWater(ml: number | null): string {
  if (ml == null || ml <= 0) return '—'
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)}`
  return String(ml)
}

function waterUnit(ml: number | null): string {
  if (ml != null && ml > 0 && ml < 1000) return 'ml'
  return 'L'
}

function formatSleep(hours: number | null): string {
  if (hours == null || hours <= 0) return '—'
  let h = Math.floor(hours)
  let m = Math.round((hours - h) * 60)
  if (m === 60) {
    h += 1
    m = 0
  }
  if (m === 0) return `${h}`
  return `${h}:${String(m).padStart(2, '0')}`
}

function MetricCard({
  icon: Icon,
  name,
  value,
  unit,
  hint,
  active,
  onClick,
}: {
  icon: typeof Droplets
  name: string
  value: string
  unit: string
  hint?: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-11 flex-col items-start gap-1 rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-left transition-colors',
        'hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active && 'border-primary/50 bg-primary/5'
      )}
    >
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
        {name}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="font-heading text-xl font-semibold tracking-wide tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </span>
      {hint ? <span className="text-[11px] text-muted-foreground/80">{hint}</span> : null}
    </button>
  )
}

/** Centered modal popup for metric editors (mobile + desktop). */
function MetricModal({
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
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export function DailyEssentials({
  values,
  onChange,
  targets,
}: {
  values: DailyEssentialsValues
  onChange: (next: DailyEssentialsValues) => void
  targets: DailyTargets
}) {
  const [editing, setEditing] = useState<MetricKey | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const draftId = useId()

  const [draftWaterMl, setDraftWaterMl] = useState(0)
  const [draftSteps, setDraftSteps] = useState(0)
  const [draftProtein, setDraftProtein] = useState(0)
  const [draftCalories, setDraftCalories] = useState(0)
  const [draftSleepH, setDraftSleepH] = useState(0)
  const [draftSleepM, setDraftSleepM] = useState(0)

  function openMetric(key: MetricKey) {
    if (key === 'water') setDraftWaterMl(values.waterMl ?? 0)
    if (key === 'steps') setDraftSteps(values.steps ?? 0)
    if (key === 'protein') setDraftProtein(values.proteinG ?? 0)
    if (key === 'calories') setDraftCalories(values.calories ?? 0)
    if (key === 'sleep') {
      const h = values.sleepHours ?? 0
      setDraftSleepH(Math.floor(h))
      setDraftSleepM(Math.round((h - Math.floor(h)) * 60))
    }
    setEditing(key)
  }

  function closeEditor() {
    setEditing(null)
  }

  function commitWater(ml: number) {
    const next = Math.min(CHECKIN_LIMITS.waterMlMax, Math.max(0, Math.round(ml)))
    onChange({ ...values, waterMl: next > 0 ? next : null })
  }

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border bg-muted/30 p-3.5">
      <div>
        <p className="font-medium">Daily essentials</p>
        <p className="text-xs text-muted-foreground">Tap a card to update — saved with your check-in</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricCard
          icon={Droplets}
          name="Water"
          value={formatWater(values.waterMl)}
          unit={waterUnit(values.waterMl)}
          hint={`Goal ${(targets.waterTarget / 1000).toFixed(1)}L`}
          active={editing === 'water'}
          onClick={() => openMetric('water')}
        />
        <MetricCard
          icon={Footprints}
          name="Steps"
          value={values.steps != null && values.steps > 0 ? values.steps.toLocaleString() : '—'}
          unit="steps"
          hint={`Goal ${targets.stepsTarget.toLocaleString()}`}
          active={editing === 'steps'}
          onClick={() => openMetric('steps')}
        />
        <MetricCard
          icon={Beef}
          name="Protein"
          value={values.proteinG != null && values.proteinG > 0 ? String(values.proteinG) : '—'}
          unit="g"
          hint={`Goal ${targets.proteinTarget}g`}
          active={editing === 'protein'}
          onClick={() => openMetric('protein')}
        />
        <MetricCard
          icon={Flame}
          name="Calories"
          value={values.calories != null && values.calories > 0 ? values.calories.toLocaleString() : '—'}
          unit="kcal"
          hint={`Goal ${targets.calorieTarget}`}
          active={editing === 'calories'}
          onClick={() => openMetric('calories')}
        />
        <MetricCard
          icon={Moon}
          name="Sleep"
          value={formatSleep(values.sleepHours)}
          unit={values.sleepHours != null && values.sleepHours > 0 ? 'h' : ''}
          hint={`Goal ${targets.sleepTarget}h`}
          active={editing === 'sleep'}
          onClick={() => openMetric('sleep')}
        />
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          className={cn(
            'flex min-h-11 flex-col items-start gap-1 rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-left',
            'hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            notesOpen && 'border-primary/50 bg-primary/5'
          )}
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <NotebookPen className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
            Notes
          </span>
          <span className="line-clamp-2 text-sm text-foreground/90">
            {values.notes.trim() ? values.notes : 'Optional'}
          </span>
        </button>
      </div>

      {notesOpen && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${draftId}-notes`}>Notes</Label>
          <Textarea
            id={`${draftId}-notes`}
            value={values.notes}
            maxLength={CHECKIN_LIMITS.notesMax}
            rows={3}
            placeholder="How did today go?"
            onChange={(e) => onChange({ ...values, notes: e.target.value })}
          />
        </div>
      )}

      <MetricModal open={editing === 'water'} onClose={closeEditor} title="Water">
        <p className="text-sm text-muted-foreground">
          Current {formatWater(values.waterMl)}
          {waterUnit(values.waterMl)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              const next = (values.waterMl ?? 0) + 250
              setDraftWaterMl(next)
              commitWater(next)
            }}
          >
            +250 ml
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              const next = (values.waterMl ?? 0) + 500
              setDraftWaterMl(next)
              commitWater(next)
            }}
          >
            +500 ml
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              setDraftWaterMl(0)
              onChange({ ...values, waterMl: null })
              closeEditor()
            }}
          >
            Clear
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${draftId}-water`}>Set total (ml)</Label>
          <Input
            id={`${draftId}-water`}
            type="number"
            inputMode="numeric"
            min={0}
            max={CHECKIN_LIMITS.waterMlMax}
            value={draftWaterMl}
            onChange={(e) => setDraftWaterMl(Number(e.target.value) || 0)}
            className="h-11"
          />
        </div>
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full"
          onClick={() => {
            commitWater(draftWaterMl)
            closeEditor()
          }}
        >
          Done
        </Button>
      </MetricModal>

      <MetricModal open={editing === 'steps'} onClose={closeEditor} title="Steps">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${draftId}-steps`}>Steps</Label>
          <Input
            id={`${draftId}-steps`}
            type="number"
            inputMode="numeric"
            min={0}
            max={CHECKIN_LIMITS.stepsMax}
            value={draftSteps}
            onChange={(e) => setDraftSteps(Math.trunc(Number(e.target.value) || 0))}
            className="h-11"
          />
        </div>
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full"
          onClick={() => {
            const n = Math.min(CHECKIN_LIMITS.stepsMax, Math.max(0, draftSteps))
            onChange({ ...values, steps: n > 0 ? n : null })
            closeEditor()
          }}
        >
          Done
        </Button>
      </MetricModal>

      <MetricModal open={editing === 'protein'} onClose={closeEditor} title="Protein">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${draftId}-protein`}>Protein (g)</Label>
          <Input
            id={`${draftId}-protein`}
            type="number"
            inputMode="numeric"
            min={0}
            max={CHECKIN_LIMITS.proteinGMax}
            value={draftProtein}
            onChange={(e) => setDraftProtein(Math.trunc(Number(e.target.value) || 0))}
            className="h-11"
          />
        </div>
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full"
          onClick={() => {
            const n = Math.min(CHECKIN_LIMITS.proteinGMax, Math.max(0, draftProtein))
            onChange({ ...values, proteinG: n > 0 ? n : null })
            closeEditor()
          }}
        >
          Done
        </Button>
      </MetricModal>

      <MetricModal open={editing === 'calories'} onClose={closeEditor} title="Calories">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${draftId}-calories`}>Calories (kcal)</Label>
          <Input
            id={`${draftId}-calories`}
            type="number"
            inputMode="numeric"
            min={0}
            max={CHECKIN_LIMITS.caloriesMax}
            value={draftCalories}
            onChange={(e) => setDraftCalories(Math.trunc(Number(e.target.value) || 0))}
            className="h-11"
          />
        </div>
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full"
          onClick={() => {
            const n = Math.min(CHECKIN_LIMITS.caloriesMax, Math.max(0, draftCalories))
            onChange({ ...values, calories: n > 0 ? n : null })
            closeEditor()
          }}
        >
          Done
        </Button>
      </MetricModal>

      <MetricModal open={editing === 'sleep'} onClose={closeEditor} title="Sleep">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${draftId}-sleep-h`}>Hours</Label>
            <Input
              id={`${draftId}-sleep-h`}
              type="number"
              inputMode="numeric"
              min={0}
              max={24}
              value={draftSleepH}
              onChange={(e) => setDraftSleepH(Math.min(24, Math.max(0, Math.trunc(Number(e.target.value) || 0))))}
              className="h-11"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${draftId}-sleep-m`}>Minutes</Label>
            <Input
              id={`${draftId}-sleep-m`}
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              step={5}
              value={draftSleepM}
              onChange={(e) => setDraftSleepM(Math.min(59, Math.max(0, Math.trunc(Number(e.target.value) || 0))))}
              className="h-11"
            />
          </div>
        </div>
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full"
          onClick={() => {
            const total = Math.min(CHECKIN_LIMITS.sleepHoursMax, draftSleepH + draftSleepM / 60)
            onChange({ ...values, sleepHours: total > 0 ? Math.round(total * 100) / 100 : null })
            closeEditor()
          }}
        >
          Done
        </Button>
      </MetricModal>
    </div>
  )
}
