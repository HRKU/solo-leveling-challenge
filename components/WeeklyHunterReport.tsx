'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, LockKeyhole, Sparkles } from 'lucide-react'
import { generateWeeklyReport } from '@/app/actions/weekly-reports'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeeklyReportViewState } from '@/lib/weekly-report/data'

function formatDateRange(startDate: string, endDate: string): string {
  const format = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return `${format(startDate)}–${format(endDate)}`
}

function ProgressCount({ value, target, label }: { value: number; target: number; label: string }) {
  const complete = value >= target
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={complete ? 'font-heading text-lg font-bold text-emerald-400' : 'font-heading text-lg font-bold text-primary'}>
          {Math.min(value, target)}/{target}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={complete ? 'h-full rounded-full bg-emerald-400' : 'h-full rounded-full bg-primary'}
          style={{ width: `${Math.min(100, value / target * 100)}%` }}
        />
      </div>
    </div>
  )
}

export function WeeklyHunterReport({ initialState }: { initialState: WeeklyReportViewState }) {
  const [state, setState] = useState(initialState)
  const [retrying, startRetry] = useTransition()

  function retryReport() {
    if (state.kind !== 'failed') return
    const weekStartDate = state.weekStartDate
    setState({ kind: 'generating', weekStartDate })
    startRetry(async () => setState(await generateWeeklyReport()))
  }

  useEffect(() => {
    if (state.kind !== 'eligible') return
    let active = true
    generateWeeklyReport().then((nextState) => {
      if (active) setState(nextState)
    })
    return () => { active = false }
  }, [state])

  if (state.kind === 'disabled') {
    return (
      <Card className="border-primary/15 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="flex items-center gap-4">
          <LockKeyhole className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold">Weekly Hunter Report</p>
            <p className="mt-1 text-xs text-muted-foreground">{state.message}</p>
          </div>
          <Link href="/settings#ai-coaching" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Enable</Link>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === 'ineligible') {
    const currentComplete = state.currentWeek.checkInDays >= 3 && state.currentWeek.workoutDays >= 2
    return (
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <NoxPixelMascot state={currentComplete ? 'success' : 'idle'} decorative className="size-14 shrink-0" />
            <div>
              <p className="font-heading text-sm font-semibold">
                {currentComplete ? 'This week is report-ready' : 'Building this week’s report'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {currentComplete
                  ? `Keep logging through ${formatDateRange(state.currentWeek.startDate, state.currentWeek.endDate)}. Nox will analyze it after the week ends.`
                  : `Activity from ${formatDateRange(state.currentWeek.startDate, state.currentWeek.endDate)} is counting now. Analysis unlocks after the week ends.`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <ProgressCount value={state.currentWeek.checkInDays} target={3} label="Check-in days" />
            <ProgressCount value={state.currentWeek.workoutDays} target={2} label="Workout days" />
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/35 px-3 py-2.5 text-[0.68rem] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Previous week · {formatDateRange(state.reportingWeek.startDate, state.reportingWeek.endDate)}:</span>{' '}
            no report generated ({state.reportingWeek.checkInDays}/3 check-ins, {state.reportingWeek.workoutDays}/2 workouts). {state.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === 'generating' || state.kind === 'eligible') {
    return (
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-card via-primary/5 to-card">
        <CardContent className="flex items-center gap-4 py-5">
          <NoxPixelMascot state="loading" decorative className="size-16 shrink-0" />
          <div>
            <p className="font-heading text-sm font-semibold">Nox is reading the shadows…</p>
            <p className="mt-1 text-xs text-muted-foreground">Comparing your completed week with your personal baseline.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const report = state.report
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <Badge variant="outline" className="absolute top-4 right-4 z-10 shrink-0 px-2.5 py-1 text-sm">
        <CalendarDays /> {formatDateRange(state.weekStartDate, new Date(new Date(`${state.weekStartDate}T00:00:00Z`).getTime() + 6 * 86_400_000).toISOString().slice(0, 10))}
      </Badge>
      <CardHeader className="flex items-center gap-3 pt-12 pr-4 sm:pt-0 sm:pr-40">
        <NoxPixelMascot state={state.kind === 'ready' ? 'success' : 'error'} decorative className="size-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-heading text-base">Nox’s Weekly Hunter Report</CardTitle>
            <Badge variant={state.kind === 'ready' ? 'secondary' : 'outline'}>
              {state.kind === 'ready' ? <><Sparkles className="size-3" /> AI analysis</> : 'Private summary'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {state.kind === 'failed' ? (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-amber-300">{state.message}</p>
            <Button type="button" variant="outline" size="sm" disabled={retrying} onClick={retryReport}>
              Retry AI analysis
            </Button>
          </div>
        ) : null}
        {report ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed font-medium text-foreground">{report.verdict}</p>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
              <p className="text-[0.65rem] font-semibold tracking-widest text-emerald-400 uppercase">Weekly win</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{report.strongestProgress}</p>
            </div>
            <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.68rem] text-muted-foreground">Private report · Generated by Nox using AI</p>
              <Link
                href={`/reports/weekly/${state.weekStartDate}`}
                className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full sm:w-auto' })}
              >
                View detailed report <ArrowRight />
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">The summary could not be displayed. Try again next week.</p>
        )}
      </CardContent>
    </Card>
  )
}
