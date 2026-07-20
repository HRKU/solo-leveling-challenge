'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Dumbbell, GripVertical, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getExerciseById } from '@/lib/exercise-catalog'
import {
  createEntry,
  estimateWorkoutXp,
  summarizeEntry,
  type WorkoutEntry,
} from '@/lib/workout-logger'
import { ExercisePickerSheet } from '@/components/workout/ExercisePickerSheet'
import { ExerciseEditorSheet } from '@/components/workout/ExerciseEditorSheet'
import { cn } from '@/lib/utils'

export function WorkoutLogger({
  entries,
  onChange,
  className,
}: {
  entries: WorkoutEntry[]
  onChange: (entries: WorkoutEntry[]) => void
  className?: string
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editing = entries.find((e) => e.id === editingId) ?? null
  const estXp = estimateWorkoutXp(entries)

  function upsertEntry(next: WorkoutEntry) {
    const i = entries.findIndex((e) => e.id === next.id)
    if (i === -1) onChange([...entries, next])
    else {
      const copy = [...entries]
      copy[i] = next
      onChange(copy)
    }
  }

  function moveEntry(id: string, dir: -1 | 1) {
    const i = entries.findIndex((e) => e.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= entries.length) return
    const copy = [...entries]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    onChange(copy)
  }

  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border bg-muted/30 p-3.5', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dumbbell className="size-4 shrink-0 text-primary" strokeWidth={2} />
          <div>
            <p className="font-medium">Today&apos;s workout</p>
            <p className="text-xs text-muted-foreground">Search, add sets, weight &amp; reps</p>
          </div>
        </div>
        {entries.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Sparkles className="size-3" />
            ~{estXp} XP
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No exercises yet. Add what you trained.</p>
          <Button type="button" className="min-h-11" onClick={() => setPickerOpen(true)}>
            <Plus className="size-4" />
            Add exercise
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry, index) => {
            const ex = getExerciseById(entry.exerciseId)
            return (
              <li key={entry.id}>
                <div className="flex items-stretch gap-1 rounded-xl border border-border/60 bg-background/60">
                  <div className="flex flex-col justify-center border-r border-border/40 px-0.5">
                    <button
                      type="button"
                      className="flex min-h-11 min-w-11 items-center justify-center rounded text-muted-foreground disabled:opacity-30"
                      disabled={index === 0}
                      aria-label="Move up"
                      onClick={() => moveEntry(entry.id, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <GripVertical className="mx-auto size-3.5 text-muted-foreground/50" />
                    <button
                      type="button"
                      className="flex min-h-11 min-w-11 items-center justify-center rounded text-muted-foreground disabled:opacity-30"
                      disabled={index === entries.length - 1}
                      aria-label="Move down"
                      onClick={() => moveEntry(entry.id, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="flex min-h-11 min-w-0 flex-1 flex-col items-start justify-center gap-0.5 px-3 py-3 text-left"
                    onClick={() => setEditingId(entry.id)}
                  >
                    <span className="truncate font-medium">{ex?.name ?? entry.exerciseId}</span>
                    <span className="text-xs text-muted-foreground">{summarizeEntry(entry, ex)}</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {entries.length > 0 && (
        <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => setPickerOpen(true)}>
          <Plus className="size-4" />
          Add exercise
        </Button>
      )}

      <ExercisePickerSheet
        key={pickerOpen ? 'picker-open' : 'picker-closed'}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={entries.map((e) => e.exerciseId)}
        onSelect={(exerciseId) => {
          const next = createEntry(exerciseId)
          upsertEntry(next)
          setPickerOpen(false)
          setEditingId(next.id)
        }}
      />

      <ExerciseEditorSheet
        open={Boolean(editing)}
        entry={editing}
        onClose={() => setEditingId(null)}
        onSave={upsertEntry}
        onRemove={
          editing
            ? () => {
                onChange(entries.filter((e) => e.id !== editing.id))
                setEditingId(null)
              }
            : undefined
        }
      />
    </div>
  )
}
