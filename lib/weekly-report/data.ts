import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { AiWeeklyReport, Profile, WeeklyCheckin, WeeklyReportContent } from '@/lib/types'
import { evaluateReportEligibility, lastCompletedWeek } from '@/lib/weekly-report/aggregate'
import { currentWeekStartDate } from '@/lib/week'
import type { ReportEligibilityStatus } from '@/lib/weekly-report/types'
import type { ReportDailyCheckin } from '@/lib/weekly-report/types'
import { REPORT_PROMPT_VERSION } from '@/lib/weekly-report/config'

const REPORT_CHECKIN_COLUMNS = 'checkin_date,workout_done,calories,protein_g,water_ml,sleep_hours,steps,workout_entries'

export type WeeklyReportViewState =
  | { kind: 'disabled'; message: string }
  | {
      kind: 'ineligible'
      reason: ReportEligibilityStatus
      message: string
      reportingWeek: { startDate: string; endDate: string; checkInDays: number; workoutDays: number }
      currentWeek: { startDate: string; endDate: string; checkInDays: number; workoutDays: number }
    }
  | { kind: 'eligible'; weekStartDate: string }
  | { kind: 'generating'; weekStartDate: string }
  | { kind: 'failed'; weekStartDate: string; message: string; report: WeeklyReportContent | null }
  | { kind: 'ready'; weekStartDate: string; report: WeeklyReportContent; generatedAt: string | null }

const ELIGIBILITY_MESSAGES: Record<Exclude<ReportEligibilityStatus, 'eligible'>, string> = {
  not_opted_in: 'Enable Weekly Hunter Reports in Settings to receive Nox’s analysis.',
  incomplete_profile: 'Complete your Hunter profile to unlock weekly analysis.',
  insufficient_daily_logs: 'Nox needs at least 3 daily check-in days from the completed week.',
  insufficient_workouts: 'Nox needs at least 2 workout days from the completed week.',
  missing_exercise_details: 'Add sets, reps, or duration to at least one workout for exercise analysis.',
}

export async function getWeeklyReportViewState(userId: string): Promise<WeeklyReportViewState> {
  const supabase = await createClient()
  const { startDate, endDate } = lastCompletedWeek()
  const thisWeekStart = currentWeekStartDate()
  const today = new Date().toISOString().slice(0, 10)
  const thisWeekEndDate = new Date(`${thisWeekStart}T00:00:00Z`)
  thisWeekEndDate.setUTCDate(thisWeekEndDate.getUTCDate() + 6)
  const thisWeekEnd = thisWeekEndDate.toISOString().slice(0, 10)
  const historyStart = new Date(`${startDate}T00:00:00Z`)
  historyStart.setUTCDate(historyStart.getUTCDate() - 28)

  const [{ data: preference }, { data: report }, { data: profile }, { data: checkins }] = await Promise.all([
    supabase.from('ai_report_preferences').select('weekly_enabled').eq('user_id', userId).maybeSingle(),
    supabase.from('ai_weekly_reports').select('id,user_id,week_start_date,status,report,model,prompt_version,generation_started_at,generated_at').eq('user_id', userId).eq('week_start_date', startDate).maybeSingle<AiWeeklyReport>(),
    supabase.from('profiles').select('age,sex,height_cm,current_weight_kg,target_weight_kg,goal_type,onboarded').eq('id', userId).single<Profile>(),
    supabase.from('daily_checkins').select(REPORT_CHECKIN_COLUMNS).eq('user_id', userId).gte('checkin_date', historyStart.toISOString().slice(0, 10)).lte('checkin_date', today).returns<ReportDailyCheckin[]>(),
  ])

  if (!preference?.weekly_enabled) {
    return { kind: 'disabled', message: 'Enable Weekly Hunter Reports in Settings to receive Nox’s analysis.' }
  }
  const currentRows = (checkins ?? []).filter((row) => row.checkin_date >= startDate && row.checkin_date <= endDate)
  const eligibility = evaluateReportEligibility(profile!, currentRows, true)
  if (eligibility.status !== 'eligible') {
    const thisWeekRows = (checkins ?? []).filter((row) => row.checkin_date >= thisWeekStart && row.checkin_date <= today)
    const thisWeekProgress = evaluateReportEligibility(profile!, thisWeekRows, true)
    return {
      kind: 'ineligible',
      reason: eligibility.status,
      message: ELIGIBILITY_MESSAGES[eligibility.status],
      reportingWeek: { startDate, endDate, checkInDays: eligibility.checkInDays, workoutDays: eligibility.workoutDays },
      currentWeek: {
        startDate: thisWeekStart,
        endDate: thisWeekEnd,
        checkInDays: thisWeekProgress.checkInDays,
        workoutDays: thisWeekProgress.workoutDays,
      },
    }
  }
  if (report?.status === 'ready' && report.report && report.prompt_version === REPORT_PROMPT_VERSION) {
    return { kind: 'ready', weekStartDate: startDate, report: report.report, generatedAt: report.generated_at }
  }
  if (report?.status === 'pending') {
    const isStale = Date.now() - new Date(report.generation_started_at).getTime() > 2 * 60 * 1000
    if (!isStale) return { kind: 'generating', weekStartDate: startDate }
  }
  if (report?.status === 'failed') {
    return { kind: 'failed', weekStartDate: startDate, message: 'Nox could not complete the AI analysis. A private summary is shown instead.', report: report.report }
  }
  return { kind: 'eligible', weekStartDate: startDate }
}

export async function loadReportSource(userId: string, weekStartDate: string) {
  const supabase = await createClient()
  const historyStart = new Date(`${weekStartDate}T00:00:00Z`)
  historyStart.setUTCDate(historyStart.getUTCDate() - 28)
  const end = new Date(`${weekStartDate}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + 6)
  const [{ data: profile }, { data: checkins }, { data: weeklyCheckins }] = await Promise.all([
    supabase.from('profiles').select('age,sex,height_cm,current_weight_kg,target_weight_kg,goal_type,onboarded').eq('id', userId).single<Profile>(),
    supabase.from('daily_checkins').select(REPORT_CHECKIN_COLUMNS).eq('user_id', userId).gte('checkin_date', historyStart.toISOString().slice(0, 10)).lte('checkin_date', end.toISOString().slice(0, 10)).returns<ReportDailyCheckin[]>(),
    supabase.from('weekly_checkins').select('id,user_id,week_start_date,weight_kg,body_fat_pct,created_at,updated_at').eq('user_id', userId).gte('week_start_date', historyStart.toISOString().slice(0, 10)).lte('week_start_date', end.toISOString().slice(0, 10)).returns<WeeklyCheckin[]>(),
  ])
  return { profile, checkins: checkins ?? [], weeklyCheckins: weeklyCheckins ?? [] }
}

export async function getDetailedWeeklyReport(userId: string, weekStartDate: string): Promise<AiWeeklyReport | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ai_weekly_reports')
    .select('id,user_id,week_start_date,status,report,source_payload,model,prompt_version,input_tokens,output_tokens,generation_started_at,generated_at')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('status', 'ready')
    .maybeSingle<AiWeeklyReport>()
  return data ?? null
}
