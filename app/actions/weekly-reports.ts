'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  buildPersonalQuestCandidates,
  buildPersonalQuestRows,
  questPeriodAfter,
  selectQuestCandidates,
  type PersonalQuestHistory,
} from '@/lib/personal-quests/selection'
import { calculateDailyTargets } from '@/lib/targets'
import { resumTotalXp } from '@/lib/xp-resum'
import { buildWeeklyReportPayload, evaluateReportEligibility, lastCompletedWeek } from '@/lib/weekly-report/aggregate'
import { loadReportSource, type WeeklyReportViewState } from '@/lib/weekly-report/data'
import { deterministicReport, generateWithGroq } from '@/lib/weekly-report/provider'
import { REPORT_PROMPT_VERSION } from '@/lib/weekly-report/config'

async function syncProfileXp(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { totalXp, level, rank } = await resumTotalXp(admin, userId)
  const { error } = await admin.from('profiles').update({ total_xp: totalXp, level, rank }).eq('id', userId)
  if (error) console.error('Unable to sync profile XP after personal quest creation:', error.code)
}

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

  const payload = buildWeeklyReportPayload({
    profile: source.profile,
    checkins: source.checkins,
    weeklyCheckins: source.weeklyCheckins,
    weekStartDate: startDate,
  })
  const targets = calculateDailyTargets({
    age: source.profile.age!,
    sex: source.profile.sex!,
    heightCm: source.profile.height_cm!,
    currentWeightKg: source.profile.current_weight_kg!,
    goalType: source.profile.goal_type!,
  })
  const admin = createAdminClient()
  const { startsOn } = questPeriodAfter(startDate)
  const { data: questHistory } = await admin
    .from('personal_quests')
    .select('quest_type,parameters,target,status')
    .eq('user_id', user.id)
    .lt('ends_on', startsOn)
    .order('ends_on', { ascending: false })
    .limit(12)
    .returns<PersonalQuestHistory[]>()
  const candidates = buildPersonalQuestCandidates(payload, targets, questHistory ?? [])
  const { data: existing } = await admin
    .from('ai_weekly_reports')
    .select('id,status,report,prompt_version,generation_started_at,generated_at')
    .eq('user_id', user.id)
    .eq('week_start_date', startDate)
    .maybeSingle()
  if (existing?.status === 'ready' && existing.report && existing.prompt_version === REPORT_PROMPT_VERSION) {
    const selectedQuests = selectQuestCandidates(candidates, existing.report.questCandidateIds)
    const rows = buildPersonalQuestRows({
      userId: user.id,
      reportId: existing.id,
      reportWeekStartDate: startDate,
      payload,
      targets,
      selectedQuests,
      missions: existing.report.missions,
    })
    const { error: questError } = await admin
      .from('personal_quests')
      .upsert(rows, { onConflict: 'user_id,source_report_id,quest_type', ignoreDuplicates: true })
    if (questError) console.error('Unable to create personal quests for ready report:', questError.code)
    else {
      await syncProfileXp(admin, user.id)
      revalidatePath('/quests')
    }
    return { kind: 'ready', weekStartDate: startDate, report: existing.report, generatedAt: existing.generated_at }
  }
  if (existing?.status === 'pending' && Date.now() - new Date(existing.generation_started_at).getTime() <= 2 * 60 * 1000) {
    return { kind: 'generating', weekStartDate: startDate }
  }

  const reservation = existing
    ? await admin.from('ai_weekly_reports').update({ status: 'pending', prompt_version: REPORT_PROMPT_VERSION, failure_code: null, generation_started_at: new Date().toISOString() }).eq('user_id', user.id).eq('week_start_date', startDate)
    : await admin.from('ai_weekly_reports').insert({ user_id: user.id, week_start_date: startDate, status: 'pending', prompt_version: REPORT_PROMPT_VERSION })
  if (reservation.error) return { kind: 'generating', weekStartDate: startDate }

  try {
    const generated = await generateWithGroq(payload, candidates)
    const generatedAt = new Date().toISOString()
    const { data: savedReport, error } = await admin.from('ai_weekly_reports').update({
      status: 'ready',
      report: generated.content,
      source_payload: payload,
      model: generated.model,
      input_tokens: generated.inputTokens,
      output_tokens: generated.outputTokens,
      generated_at: generatedAt,
      failure_code: null,
      prompt_version: REPORT_PROMPT_VERSION,
    }).eq('user_id', user.id).eq('week_start_date', startDate).select('id').single()
    if (error || !savedReport) throw new Error('REPORT_SAVE_FAILED')

    const questRows = buildPersonalQuestRows({
      userId: user.id,
      reportId: savedReport.id,
      reportWeekStartDate: startDate,
      payload,
      targets,
      selectedQuests: generated.quests,
      missions: generated.content.missions,
    })
    const { error: questError } = await admin
      .from('personal_quests')
      .upsert(questRows, { onConflict: 'user_id,source_report_id,quest_type', ignoreDuplicates: true })
    if (questError) console.error('Unable to create personal quests after report generation:', questError.code)
    else await syncProfileXp(admin, user.id)
    revalidatePath('/')
    revalidatePath('/quests')
    return { kind: 'ready', weekStartDate: startDate, report: generated.content, generatedAt }
  } catch (error) {
    const fallback = deterministicReport(payload, candidates)
    await admin.from('ai_weekly_reports').update({
      status: 'failed',
      source_payload: payload,
      report: fallback,
      failure_code: error instanceof Error ? error.message.slice(0, 80) : 'UNKNOWN_FAILURE',
    }).eq('user_id', user.id).eq('week_start_date', startDate)
    return { kind: 'failed', weekStartDate: startDate, message: 'AI analysis is temporarily unavailable. Nox prepared a private data summary instead.', report: fallback }
  }
}
