'use client'

import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatWeekLabel } from '@/lib/week'
import type { GoalType } from '@/lib/targets'
import type { WeeklyCheckin } from '@/lib/types'
import { cn } from '@/lib/utils'

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

function signalDot(delta: number, goalType: GoalType | null): string {
  if (delta === 0) return 'bg-muted-foreground/60'
  return deltaIsFavorable(delta, goalType) ? 'bg-emerald-400' : 'bg-red-400'
}

function signalHex(delta: number, goalType: GoalType | null): string {
  if (delta === 0) return 'oklch(0.65 0 0)'
  return deltaIsFavorable(delta, goalType) ? 'oklch(0.75 0.16 155)' : 'oklch(0.68 0.18 25)'
}

const chartConfig = {
  weight: {
    label: 'Weight',
    color: 'var(--primary)',
  },
  target: {
    label: 'Target',
    color: 'oklch(0.78 0.12 85)',
  },
} satisfies ChartConfig

type ChartRow = {
  week: string
  label: string
  weight: number
  change: number | null
  bodyFat: number | null
}

function WeightDot({
  cx,
  cy,
  payload,
  goalType,
}: {
  cx?: number
  cy?: number
  payload?: ChartRow
  goalType: GoalType | null
}) {
  if (cx == null || cy == null || !payload) return null
  const change = payload.change
  const fill = change == null ? 'var(--primary)' : signalHex(change, goalType)
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={fill} opacity={0.2} />
      <circle cx={cx} cy={cy} r={3.5} fill={fill} stroke="var(--background)" strokeWidth={2} />
    </g>
  )
}

export function WeightTrendChart({
  checkins,
  startingWeightKg,
  targetWeightKg,
  goalType = null,
  hideEmptyCard = false,
}: {
  checkins: WeeklyCheckin[]
  startingWeightKg: number | null
  targetWeightKg: number | null
  goalType?: GoalType | null
  hideEmptyCard?: boolean
}) {
  if (checkins.length === 0) {
    if (hideEmptyCard) return null
    return (
      <section className="rounded-2xl border border-border/40 bg-muted/10 p-5">
        <p className="text-sm text-muted-foreground">Log a weekly weigh-in to see your trend.</p>
      </section>
    )
  }

  const latest = checkins[checkins.length - 1]!
  const delta = startingWeightKg != null ? latest.weight_kg - startingWeightKg : null
  const DeltaIcon = delta == null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown

  const chartData: ChartRow[] = checkins.map((c, i) => {
    const prev = i === 0 ? startingWeightKg : checkins[i - 1]!.weight_kg
    return {
      week: c.week_start_date,
      label: formatWeekLabel(c.week_start_date),
      weight: c.weight_kg,
      change: prev != null ? c.weight_kg - prev : null,
      bodyFat: c.body_fat_pct,
    }
  })

  const weights = chartData.map((d) => d.weight)
  const yValues = [
    ...weights,
    ...(startingWeightKg != null ? [startingWeightKg] : []),
    ...(targetWeightKg != null ? [targetWeightKg] : []),
  ]
  const yMin = Math.min(...yValues)
  const yMax = Math.max(...yValues)
  const pad = Math.max((yMax - yMin) * 0.15, 0.8)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-semibold tracking-wide text-muted-foreground">
            Weight trend
          </h2>
          {delta != null && (
            <p className={cn('mt-1 flex items-center gap-1.5 text-sm', signalClass(delta, goalType))}>
              <DeltaIcon className="size-3.5 shrink-0" strokeWidth={2.25} />
              <span className="font-display-num font-semibold tabular-nums">
                {delta === 0 ? 'Steady' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`}
              </span>
              <span className="text-muted-foreground">vs start</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 text-[0.65rem] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-red-400" />
            Watch
          </span>
          {targetWeightKg != null && (
            <span className="flex items-center gap-1.5">
              <span className="h-px w-3 border-t border-dashed border-amber-400/80" />
              Target
            </span>
          )}
        </div>
      </div>

      <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-weight)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-weight)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis
            domain={[yMin - pad, yMax + pad]}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width={36}
            tickFormatter={(v) => Number(v).toFixed(0)}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, name, item) => {
                  const row = item?.payload as ChartRow | undefined
                  const change = row?.change
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-display-num font-medium tabular-nums">
                        {Number(value).toFixed(1)} kg
                      </span>
                      {change != null && change !== 0 && (
                        <span className={cn('text-[0.7rem]', signalClass(change, goalType))}>
                          {change > 0 ? '+' : ''}
                          {change.toFixed(1)} kg
                        </span>
                      )}
                      {typeof name === 'string' && (
                        <span className="sr-only">{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                      )}
                    </div>
                  )
                }}
              />
            }
          />
          {targetWeightKg != null && (
            <ReferenceLine
              y={targetWeightKg}
              stroke="var(--color-target)"
              strokeDasharray="4 4"
              strokeWidth={1.25}
            />
          )}
          {startingWeightKg != null && (
            <ReferenceLine
              y={startingWeightKg}
              stroke="var(--muted-foreground)"
              strokeDasharray="2 6"
              strokeOpacity={0.45}
            />
          )}
          <Area
            dataKey="weight"
            type="monotone"
            fill="url(#fillWeight)"
            stroke="var(--color-weight)"
            strokeWidth={2}
            strokeDasharray="2 6"
            dot={<WeightDot goalType={goalType} />}
            activeDot={{ r: 5 }}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[18rem] text-sm" aria-label="Weigh-in history">
          <thead>
            <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Week</th>
              <th className="pb-2 pr-3 text-right font-medium">Weight</th>
              <th className="pb-2 pr-3 text-right font-medium">Change</th>
              <th className="pb-2 text-right font-medium">Body fat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {[...chartData].reverse().map((row) => (
              <tr key={row.week}>
                <td className="py-3 pr-3">
                  <span className="flex items-center gap-2.5">
                    {row.change != null ? (
                      <span className={cn('size-2 shrink-0 rounded-full', signalDot(row.change, goalType))} />
                    ) : (
                      <span className="size-2 shrink-0 rounded-full bg-primary/50" />
                    )}
                    <span className="text-muted-foreground">{row.label}</span>
                  </span>
                </td>
                <td className="py-3 pr-3 text-right font-display-num font-semibold tabular-nums">
                  {row.weight} kg
                </td>
                <td
                  className={cn(
                    'py-3 pr-3 text-right font-display-num text-xs font-medium tabular-nums',
                    row.change == null || row.change === 0
                      ? 'text-muted-foreground'
                      : signalClass(row.change, goalType)
                  )}
                >
                  {row.change == null || row.change === 0
                    ? '—'
                    : `${row.change > 0 ? '+' : ''}${row.change.toFixed(1)}`}
                </td>
                <td className="py-3 text-right font-display-num text-xs tabular-nums text-muted-foreground">
                  {row.bodyFat != null ? `${row.bodyFat}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
