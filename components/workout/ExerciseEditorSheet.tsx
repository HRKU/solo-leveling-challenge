'use client'

import { Copy, Minus, Plus, Trash2 } from 'lucide-react'
import { BottomSheet } from '@/components/workout/BottomSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getExerciseById } from '@/lib/exercise-catalog'
import {
  duplicateSet,
  emptySet,
  kgToLb,
  lbToKg,
  type WeightUnit,
  type WorkoutEntry,
  type WorkoutSet,
} from '@/lib/workout-logger'
import { cn } from '@/lib/utils'

function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  suffix,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  step?: number
  min?: number
  suffix?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Decrease ${label}`}
          className="size-11 shrink-0"
          onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
        >
          <Minus className="size-4" />
        </Button>
        <Input
          type="number"
          inputMode="decimal"
          className="h-11 text-center text-base tabular-nums"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value)
            onChange(Number.isFinite(n) ? n : min)
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Increase ${label}`}
          className="size-11 shrink-0"
          onClick={() => onChange(Math.round((value + step) * 10) / 10)}
        >
          <Plus className="size-4" />
        </Button>
        {suffix ? <span className="w-8 text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  )
}

export function ExerciseEditorSheet({
  open,
  entry,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean
  entry: WorkoutEntry | null
  onClose: () => void
  onSave: (entry: WorkoutEntry) => void
  onRemove?: () => void
}) {
  if (!entry) return null
  const exercise = getExerciseById(entry.exerciseId)
  const mode = exercise?.loggingMode ?? 'bodyweight_reps'
  const showReps = mode === 'bodyweight_reps' || mode === 'weighted_reps'
  const showDuration = mode === 'duration' || mode === 'weighted_duration'
  const showWeight = mode === 'weighted_reps' || mode === 'weighted_duration'

  function updateSet(setId: string, patch: Partial<WorkoutSet>) {
    onSave({
      ...entry!,
      sets: entry!.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    })
  }

  function setUnit(unit: WeightUnit) {
    if (unit === entry!.weightUnit) return
    onSave({
      ...entry!,
      weightUnit: unit,
      sets: entry!.sets.map((s) => ({
        ...s,
        weight:
          s.weight == null
            ? null
            : unit === 'lb'
              ? kgToLb(s.weight)
              : lbToKg(s.weight),
      })),
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={exercise?.name ?? 'Exercise'}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4">
        {showWeight && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Weight unit</span>
            <div className="flex rounded-lg bg-muted p-0.5">
              {(['kg', 'lb'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium uppercase',
                    entry.weightUnit === u ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {entry.sets.map((set, index) => (
            <div key={set.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Set {index + 1}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Duplicate set"
                    onClick={() =>
                      onSave({
                        ...entry,
                        sets: [
                          ...entry.sets.slice(0, index + 1),
                          duplicateSet(set),
                          ...entry.sets.slice(index + 1),
                        ],
                      })
                    }
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  {entry.sets.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Delete set"
                      onClick={() =>
                        onSave({
                          ...entry,
                          sets: entry.sets.filter((s) => s.id !== set.id),
                        })
                      }
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {showReps && (
                  <Stepper
                    label="Reps"
                    value={set.reps ?? 0}
                    onChange={(n) => updateSet(set.id, { reps: n })}
                    step={1}
                  />
                )}
                {showDuration && (
                  <Stepper
                    label="Duration"
                    value={set.durationSec ?? 0}
                    onChange={(n) => updateSet(set.id, { durationSec: n })}
                    step={5}
                    suffix="sec"
                  />
                )}
                {showWeight && (
                  <Stepper
                    label="Weight"
                    value={set.weight ?? 0}
                    onChange={(n) => updateSet(set.id, { weight: n })}
                    step={2.5}
                    suffix={entry.weightUnit}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          onClick={() => onSave({ ...entry, sets: [...entry.sets, emptySet(mode)] })}
        >
          <Plus className="size-4" />
          Add set
        </Button>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`notes-${entry.id}`}>Notes — optional</Label>
          <Textarea
            id={`notes-${entry.id}`}
            value={entry.notes}
            onChange={(e) => onSave({ ...entry, notes: e.target.value })}
            placeholder="Form cues, RPE, etc."
            rows={2}
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button type="button" size="lg" className="min-h-11 w-full" onClick={onClose}>
            Done
          </Button>
          {onRemove && (
            <Button type="button" variant="ghost" className="min-h-11 w-full text-destructive" onClick={onRemove}>
              Remove exercise
            </Button>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
