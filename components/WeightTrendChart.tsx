import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { WeeklyCheckin } from '@/lib/types'

export function WeightTrendChart({
  checkins,
  startingWeightKg,
  targetWeightKg,
}: {
  checkins: WeeklyCheckin[]
  startingWeightKg: number | null
  targetWeightKg: number | null
}) {
  if (checkins.length === 0) {
    return <p className="text-sm text-muted-foreground">No weekly check-ins yet — log your first one above.</p>
  }

  const weights = checkins.map((c) => c.weight_kg)
  const min = Math.min(...weights, startingWeightKg ?? Infinity, targetWeightKg ?? Infinity)
  const max = Math.max(...weights, startingWeightKg ?? -Infinity, targetWeightKg ?? -Infinity)
  const range = max - min || 1

  const latest = checkins[checkins.length - 1]
  const delta = startingWeightKg != null ? latest.weight_kg - startingWeightKg : null

  return (
    <div className="flex flex-col gap-4">
      {delta != null && (
        <p className="text-sm">
          {delta === 0
            ? 'No change from your starting weight yet.'
            : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg from your starting weight`}
          {targetWeightKg != null && ` · target ${targetWeightKg} kg`}
        </p>
      )}

      <div className="flex h-24 items-end gap-1.5">
        {checkins.map((c) => {
          const heightPct = ((c.weight_kg - min) / range) * 80 + 20
          return (
            <div key={c.id} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-primary/70" style={{ height: `${heightPct}%` }} />
            </div>
          )
        })}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Week of</TableHead>
            <TableHead>Weight (kg)</TableHead>
            <TableHead>Body fat %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...checkins].reverse().map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.week_start_date}</TableCell>
              <TableCell>{c.weight_kg}</TableCell>
              <TableCell>{c.body_fat_pct ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
