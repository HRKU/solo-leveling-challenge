'use client'

import { useMemo, useState } from 'react'
import { LoaderCircle, Search } from 'lucide-react'
import { BottomSheet } from '@/components/workout/BottomSheet'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { sanitizeSearchQuery } from '@/lib/validation/checkin'
import {
  EXERCISE_CATEGORIES,
  loggingModeLabel,
  searchExercises,
  type ExerciseCategory,
} from '@/lib/exercise-catalog'

export function ExercisePickerSheet({
  open,
  onClose,
  onSelect,
  excludeIds,
}: {
  open: boolean
  onClose: () => void
  onSelect: (exerciseId: string) => void
  excludeIds?: string[]
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all')
  const sanitized = sanitizeSearchQuery(query)
  const debouncedQuery = useDebouncedValue(sanitized, 300)
  // Pending debounce = subtle loading; empty browse still uses debounced value.
  const searching = sanitized !== debouncedQuery
  const excluded = useMemo(() => new Set(excludeIds ?? []), [excludeIds])

  const results = useMemo(
    () => searchExercises(debouncedQuery, category).filter((e) => !excluded.has(e.id)),
    [debouncedQuery, category, excluded]
  )

  if (!open) return null

  return (
    <BottomSheet open={open} onClose={onClose} title="Add exercise">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border/40 p-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault()
              }}
              placeholder="Search moves…"
              className="h-11 pl-9"
              autoFocus
              aria-busy={searching}
            />
            {searching && (
              <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:thin]">
            {EXERCISE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  'min-h-11 shrink-0 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors',
                  category === c.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <ul
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3"
          aria-label="Exercise results"
        >
          {results.length === 0 && (
            <li className="px-1 py-8 text-center text-sm text-muted-foreground">
              {debouncedQuery ? 'No exercises match.' : 'No exercises available.'}
            </li>
          )}
          {results.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(ex.id)
                  setQuery('')
                }}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/80 active:bg-muted"
              >
                <span className="font-medium text-foreground">{ex.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{loggingModeLabel(ex.loggingMode)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </BottomSheet>
  )
}
