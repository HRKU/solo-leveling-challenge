import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
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
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">No weekly check-ins yet — log your first one to start tracking.</p>
        </CardContent>
      </Card>
    )
  }

  const weights = checkins.map((c) => c.weight_kg)
  const min = Math.min(...weights, startingWeightKg ?? Infinity, targetWeightKg ?? Infinity)
  const max = Math.max(...weights, startingWeightKg ?? -Infinity, targetWeightKg ?? -Infinity)
  const range = max - min || 1

  const latest = checkins[checkins.length - 1]
  const delta = startingWeightKg != null ? latest.weight_kg - startingWeightKg : null
  const DeltaIcon = delta == null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Weight trend</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {delta != null && (
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3.5">
            <DeltaIcon className="size-4 shrink-0 text-primary" strokeWidth={2} />
            <p className="text-sm">
              <span className="font-display-num font-semibold tabular-nums">
                {delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`}
              </span>{' '}
              from your starting weight
              {targetWeightKg != null && ` · target ${targetWeightKg} kg`}
            </p>
          </div>
        )}

        <div className="flex h-24 items-end gap-1.5">
          {checkins.map((c) => {
            const heightPct = ((c.weight_kg - min) / range) * 80 + 20
            return (
              <div key={c.id} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-full bg-gradient-to-t from-primary/50 to-primary" style={{ height: `${heightPct}%` }} />
              </div>
            )
          })}
        </div>

        <div className="-mx-2 overflow-x-auto">
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
                  <TableCell className="font-display-num tabular-nums">{c.weight_kg}</TableCell>
                  <TableCell className="font-display-num tabular-nums">{c.body_fat_pct ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
