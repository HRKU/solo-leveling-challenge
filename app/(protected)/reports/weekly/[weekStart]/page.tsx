import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  Beef,
  Bot,
  CalendarDays,
  Droplets,
  Dumbbell,
  Footprints,
  Gauge,
  Moon,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDetailedWeeklyReport } from '@/lib/weekly-report/data'
import { getCurrentUserId } from '@/lib/supabase/server'
import { REPORT_PROMPT_VERSION } from '@/lib/weekly-report/config'

function weekEnd(startDate: string) {
  const date = new Date(`${startDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 6)
  return date.toISOString().slice(0, 10)
}

function weekRange(startDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${weekEnd(startDate)}T00:00:00Z`)
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const endLabel = end.toLocaleDateString('en-US', { month: start.getUTCMonth() === end.getUTCMonth() ? undefined : 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return `${startLabel}–${endLabel}`
}

function valueOrDash(value: number | null, suffix = '') {
  return value == null ? 'Not logged' : `${value.toLocaleString()}${suffix}`
}

const HABITS = [
  { key: 'sleepPct', value: 'averageSleepHours', coverage: 'sleepDays', label: 'Sleep', suffix: 'h', icon: Moon },
  { key: 'stepsPct', value: 'averageSteps', coverage: 'stepsDays', label: 'Steps', suffix: '', icon: Footprints },
  { key: 'proteinPct', value: 'averageProteinG', coverage: 'proteinDays', label: 'Protein', suffix: 'g', icon: Beef },
  { key: 'waterPct', value: 'averageWaterMl', coverage: 'waterDays', label: 'Water', suffix: 'ml', icon: Droplets },
] as const

export default async function WeeklyReportPage({ params }: { params: Promise<{ weekStart: string }> }) {
  const { weekStart } = await params
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) notFound()
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const stored = await getDetailedWeeklyReport(userId, weekStart)
  if (!stored?.report || !stored.source_payload) notFound()
  if (stored.prompt_version !== REPORT_PROMPT_VERSION) redirect('/')
  const report = stored.report
  const payload = stored.source_payload
  const generatedLabel = stored.generated_at
    ? new Date(stored.generated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Unavailable'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 pb-10 sm:p-6">
      <div>
        <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3' })}>
          <ArrowLeft /> Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <NoxPixelMascot state="success" decorative className="size-16 shrink-0 sm:size-20" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-heading text-[0.65rem] font-semibold tracking-[0.2em] text-primary uppercase">Weekly intelligence</p>
              <Badge variant="secondary"><Sparkles /> AI analysis</Badge>
            </div>
            <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">Hunter Report</h1>
          </div>
          <Badge variant="outline" className="ml-auto shrink-0 px-3 py-1.5 text-sm"><CalendarDays /> {weekRange(weekStart)}</Badge>
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="space-y-3">
          <p className="font-heading text-lg leading-relaxed font-semibold">{report.verdict}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline"><CalendarDays /> {payload.week.checkInDays} check-in days</Badge>
            <Badge variant="outline"><Dumbbell /> {payload.week.workoutDays} workout days</Badge>
            <Badge variant="outline"><Gauge /> {payload.dataFlags.hasPersonalBaseline ? `${payload.personalBaseline.eligibleWeeks} baseline weeks` : 'Baseline forming'}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-500/15 bg-emerald-500/5">
          <CardHeader><CardTitle className="text-emerald-400">Weekly win</CardTitle></CardHeader>
          <CardContent className="leading-relaxed text-muted-foreground">{report.strongestProgress}</CardContent>
        </Card>
        <Card className="border-amber-500/15 bg-amber-500/5">
          <CardHeader><CardTitle className="text-amber-400">Watch point</CardTitle></CardHeader>
          <CardContent className="leading-relaxed text-muted-foreground">{report.watchPoint}</CardContent>
        </Card>
      </div>

      <section>
        <h2 className="font-heading text-lg font-semibold">Recovery and habits</h2>
        <p className="mt-1 text-xs text-muted-foreground">Averages include logged days only; coverage is shown for context.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {HABITS.map((habit) => {
            const Icon = habit.icon
            const average = payload.week[habit.value]
            const adherence = payload.adherence[habit.key]
            const coverage = payload.habitCoverage[habit.coverage]
            return (
              <Card key={habit.key} size="sm">
                <CardContent>
                  <div className="flex items-center justify-between"><Icon className="size-4 text-primary" /><span className="text-[0.65rem] text-muted-foreground">{coverage} days</span></div>
                  <p className="mt-3 font-heading text-lg font-bold">{valueOrDash(average, habit.suffix)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{habit.label} · {adherence == null ? 'No target reading' : adherence >= 100 ? 'Target met' : `${adherence}% of target`}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold">Exercise overview</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{report.exerciseInsight}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {payload.exerciseSummary.map((exercise) => (
            <Card key={exercise.exercise} size="sm">
              <CardContent>
                <p className="font-heading text-sm font-semibold">{exercise.exercise}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div><p className="font-heading font-bold text-primary">{exercise.sessions}</p><p className="text-[0.62rem] text-muted-foreground">sessions</p></div>
                  <div><p className="font-heading font-bold">{exercise.sets}</p><p className="text-[0.62rem] text-muted-foreground">sets</p></div>
                  <div><p className="font-heading font-bold">{exercise.totalReps || Math.round(exercise.totalDurationSeconds / 60)}</p><p className="text-[0.62rem] text-muted-foreground">{exercise.totalReps ? 'reps' : 'minutes'}</p></div>
                </div>
                <p className="mt-3 border-t border-border/60 pt-2 text-[0.68rem] text-muted-foreground">
                  {exercise.changeVsBaselinePct == null ? 'Personal baseline forming' : `${exercise.changeVsBaselinePct > 0 ? '+' : ''}${exercise.changeVsBaselinePct}% vs baseline`}
                </p>
                {exercise.highestWeightKg != null ? (
                  <p className="mt-1 text-[0.68rem] text-muted-foreground">Highest logged load: {exercise.highestWeightKg} kg</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="size-4 text-primary" /> Body-goal direction</CardTitle></CardHeader>
          <CardContent className="space-y-3 leading-relaxed text-muted-foreground">
            <p>{report.bodyGoalInsight}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Goal: {payload.profile.goal}</Badge>
              <Badge variant="outline">Current: {payload.profile.currentWeightKg} kg</Badge>
              {payload.bodyTrend.fourWeekWeightChangeKg != null ? <Badge variant="outline">4-week change: {payload.bodyTrend.fourWeekWeightChangeKg > 0 ? '+' : ''}{payload.bodyTrend.fourWeekWeightChangeKg} kg</Badge> : null}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Next week’s missions</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {report.missions.map((mission, index) => (
                <li key={mission} className="flex gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
                  <span className="font-heading font-bold text-primary">{index + 1}</span>{mission}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card size="sm">
        <CardContent className="grid gap-4 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="flex items-center gap-1.5 font-medium text-foreground"><Bot className="size-3.5 text-primary" /> Generated by</p><p className="mt-1">Nox via Groq</p></div>
          <div><p className="font-medium text-foreground">Model</p><p className="mt-1 break-all">{stored.model ?? 'Provider fallback'}</p><p className="mt-0.5">{stored.input_tokens ?? '—'} in · {stored.output_tokens ?? '—'} out</p></div>
          <div><p className="font-medium text-foreground">Generated</p><p className="mt-1">{generatedLabel}</p></div>
          <div><p className="flex items-center gap-1.5 font-medium text-foreground"><ShieldCheck className="size-3.5 text-primary" /> Privacy</p><p className="mt-1">Private · schema {stored.prompt_version ?? 'v1'}</p></div>
        </CardContent>
      </Card>

      <p className="text-center font-heading text-xs text-primary">“{report.noxClosing}”</p>
    </div>
  )
}
