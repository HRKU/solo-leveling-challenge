'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buildWeeklyReportPayload, evaluateReportEligibility, lastCompletedWeek } from '@/lib/weekly-report/aggregate'
import { loadReportSource, type WeeklyReportViewState } from '@/lib/weekly-report/data'
import { deterministicReport, generateWithGroq } from '@/lib/weekly-report/provider'
import { REPORT_PROMPT_VERSION } from '@/lib/weekly-report/config'

export async function updateWeeklyReportPreference(enabled: boolean): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.from('ai_report_preferences').upsert({
    user_id: user.id,
    weekly_enabled: enabled,
    consented_at: enabled ? new Date().toISOString() : null,
  }, { onConflict: 'user_id' })
  if (error) return { error: 'Unable to update the weekly report preference.' }

  revalidatePath('/')
  revalidatePath('/settings')
  return { success: true }
}

export async function generateWeeklyReport(): Promise<WeeklyReportViewState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { kind: 'disabled', message: 'Sign in to access weekly reports.' }

  const { startDate, endDate } = lastCompletedWeek()
  const { data: preference } = await supabase
    .from('ai_report_preferences')
    .select('weekly_enabled')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!preference?.weekly_enabled) {
    return { kind: 'disabled', message: 'Enable Weekly Hunter Reports in Settings first.' }
  }

  const source = await loadReportSource(user.id, startDate)
  if (!source.profile) {
    return { kind: 'disabled', message: 'Complete your Hunter profile to unlock weekly reports.' }
  }
  const currentRows = source.checkins.filter((row) => row.checkin_date >= startDate && row.checkin_date <= endDate)
  const eligibility = evaluateReportEligibility(source.profile, currentRows, true)
  if (eligibility.status !== 'eligible') {
    return { kind: 'disabled', message: 'The completed week does not contain enough activity for an AI report.' }
  }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('ai_weekly_reports')
    .select('status,report,prompt_version,generation_started_at,generated_at')
    .eq('user_id', user.id)
    .eq('week_start_date', startDate)
    .maybeSingle()
  if (existing?.status === 'ready' && existing.report && existing.prompt_version === REPORT_PROMPT_VERSION) {
    return { kind: 'ready', weekStartDate: startDate, report: existing.report, generatedAt: existing.generated_at }
  }
  if (existing?.status === 'pending' && Date.now() - new Date(existing.generation_started_at).getTime() <= 2 * 60 * 1000) {
    return { kind: 'generating', weekStartDate: startDate }
  }

  const reservation = existing
    ? await admin.from('ai_weekly_reports').update({ status: 'pending', prompt_version: REPORT_PROMPT_VERSION, failure_code: null, generation_started_at: new Date().toISOString() }).eq('user_id', user.id).eq('week_start_date', startDate)
    : await admin.from('ai_weekly_reports').insert({ user_id: user.id, week_start_date: startDate, status: 'pending', prompt_version: REPORT_PROMPT_VERSION })
  if (reservation.error) return { kind: 'generating', weekStartDate: startDate }

  const payload = buildWeeklyReportPayload({
    profile: source.profile,
    checkins: source.checkins,
    weeklyCheckins: source.weeklyCheckins,
    weekStartDate: startDate,
  })

  try {
    const generated = await generateWithGroq(payload)
    const generatedAt = new Date().toISOString()
    const { error } = await admin.from('ai_weekly_reports').update({
      status: 'ready',
      report: generated.content,
      source_payload: payload,
      model: generated.model,
      input_tokens: generated.inputTokens,
      output_tokens: generated.outputTokens,
      generated_at: generatedAt,
      failure_code: null,
      prompt_version: REPORT_PROMPT_VERSION,
    }).eq('user_id', user.id).eq('week_start_date', startDate)
    if (error) throw new Error('REPORT_SAVE_FAILED')
    revalidatePath('/')
    return { kind: 'ready', weekStartDate: startDate, report: generated.content, generatedAt }
  } catch (error) {
    const fallback = deterministicReport(payload)
    await admin.from('ai_weekly_reports').update({
      status: 'failed',
      source_payload: payload,
      report: fallback,
      failure_code: error instanceof Error ? error.message.slice(0, 80) : 'UNKNOWN_FAILURE',
    }).eq('user_id', user.id).eq('week_start_date', startDate)
    return { kind: 'failed', weekStartDate: startDate, message: 'AI analysis is temporarily unavailable. Nox prepared a private data summary instead.', report: fallback }
  }
}
