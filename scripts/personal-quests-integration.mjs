import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !anonKey || !serviceKey) throw new Error('Missing Supabase integration-test credentials.')

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const runId = randomUUID()
const password = `Quest-${runId}-Aa1!`
const createdUserIds = []

function monday(date = new Date()) {
  const day = date.getUTCDay()
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  result.setUTCDate(result.getUTCDate() - ((day + 6) % 7))
  return result
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function shift(date, days) {
  const result = new Date(`${date}T00:00:00Z`)
  result.setUTCDate(result.getUTCDate() + days)
  return dateOnly(result)
}

async function createTestUser(label) {
  const email = `codex-quest-${label}-${runId}@example.com`
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw error ?? new Error(`Unable to create ${label} test user.`)
  createdUserIds.push(data.user.id)
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError
  return { id: data.user.id, client }
}

function reportRow(userId, weekStart) {
  return {
    user_id: userId,
    week_start_date: weekStart,
    status: 'ready',
    report: {},
    source_payload: {},
    generated_at: new Date().toISOString(),
  }
}

function questRow({ userId, reportId, type, parameters = {}, startsOn, endsOn, reward, target = 1 }) {
  return {
    user_id: userId,
    source_report_id: reportId,
    quest_type: type,
    parameters,
    title: `Integration ${type}`,
    description: `Integration coverage for ${type}.`,
    target,
    progress: 0,
    starts_on: startsOn,
    ends_on: endsOn,
    status: 'active',
    xp_reward: reward,
  }
}

try {
  const [userA, userB] = await Promise.all([createTestUser('a'), createTestUser('b')])
  const startsOn = dateOnly(monday())
  const endsOn = shift(startsOn, 6)
  const reportWeek = shift(startsOn, -7)
  const expiredStartsOn = shift(startsOn, -14)
  const expiredEndsOn = shift(expiredStartsOn, 6)

  const { data: reports, error: reportError } = await admin
    .from('ai_weekly_reports')
    .insert([
      reportRow(userA.id, reportWeek),
      reportRow(userA.id, shift(reportWeek, -14)),
      reportRow(userB.id, reportWeek),
    ])
    .select('id,user_id,week_start_date')
  if (reportError) throw reportError

  const currentReportA = reports.find((row) => row.user_id === userA.id && row.week_start_date === reportWeek)
  const expiredReportA = reports.find((row) => row.user_id === userA.id && row.week_start_date !== reportWeek)
  const reportB = reports.find((row) => row.user_id === userB.id)
  assert.ok(currentReportA && expiredReportA && reportB)

  const currentQuests = [
    questRow({ userId: userA.id, reportId: currentReportA.id, type: 'checkin_days', startsOn, endsOn, reward: 10 }),
    questRow({ userId: userA.id, reportId: currentReportA.id, type: 'workout_days', startsOn, endsOn, reward: 20 }),
    questRow({ userId: userA.id, reportId: currentReportA.id, type: 'habit_target_days', parameters: { habit: 'water_ml', dailyTarget: 2000 }, startsOn, endsOn, reward: 20 }),
    questRow({ userId: userA.id, reportId: currentReportA.id, type: 'exercise_sessions', parameters: { exerciseId: 'pushups', exerciseName: 'Push-ups' }, startsOn, endsOn, reward: 25 }),
    questRow({ userId: userA.id, reportId: currentReportA.id, type: 'exercise_total_reps', parameters: { exerciseId: 'pushups', exerciseName: 'Push-ups', unit: 'reps' }, startsOn, endsOn, reward: 35, target: 10 }),
    questRow({ userId: userA.id, reportId: currentReportA.id, type: 'exercise_total_sets', parameters: { exerciseId: 'pushups', exerciseName: 'Push-ups', unit: 'sets' }, startsOn, endsOn, reward: 25 }),
    questRow({ userId: userA.id, reportId: currentReportA.id, type: 'exercise_total_duration', parameters: { exerciseId: 'plank', exerciseName: 'Plank', unit: 'minutes' }, startsOn, endsOn, reward: 25 }),
  ]
  const { error: questError } = await admin.from('personal_quests').insert([
    ...currentQuests,
    questRow({ userId: userA.id, reportId: expiredReportA.id, type: 'checkin_days', startsOn: expiredStartsOn, endsOn: expiredEndsOn, reward: 99 }),
    questRow({ userId: userB.id, reportId: reportB.id, type: 'checkin_days', startsOn, endsOn, reward: 10 }),
  ])
  if (questError) throw questError

  const { error: duplicateError } = await admin.from('personal_quests').insert(currentQuests[0])
  assert.equal(duplicateError?.code, '23505', 'duplicate report/type quest must be rejected')

  const { data: visibleToA, error: selectAError } = await userA.client.from('personal_quests').select('id,user_id')
  if (selectAError) throw selectAError
  assert.equal(visibleToA.length, 8)
  assert.ok(visibleToA.every((row) => row.user_id === userA.id))

  const { data: visibleToB, error: selectBError } = await userB.client.from('personal_quests').select('id,user_id')
  if (selectBError) throw selectBError
  assert.equal(visibleToB.length, 1)
  assert.equal(visibleToB[0].user_id, userB.id)

  const { error: forbiddenWrite } = await userA.client
    .from('personal_quests')
    .update({ title: 'Forbidden client edit' })
    .eq('user_id', userA.id)
  assert.ok(forbiddenWrite, 'authenticated clients must not update personal quests')

  const checkin = {
    user_id: userA.id,
    checkin_date: startsOn,
    workout_done: true,
    water_ml: 2500,
    workout_entries: [{
      id: randomUUID(),
      exerciseId: 'pushups',
      weightUnit: 'kg',
      notes: null,
      sets: [{ id: randomUUID(), reps: 10, durationSec: null, weight: null }],
    }, {
      id: randomUUID(),
      exerciseId: 'plank',
      weightUnit: 'kg',
      notes: null,
      sets: [{ id: randomUUID(), reps: null, durationSec: 60, weight: null }],
    }],
  }
  const { error: checkinError } = await admin.from('daily_checkins').insert(checkin)
  if (checkinError) throw checkinError

  const { data: completed, error: completedError } = await admin
    .from('personal_quests')
    .select('id,status,progress,target,xp_reward,xp_awarded_at,completed_at')
    .eq('source_report_id', currentReportA.id)
    .order('quest_type')
  if (completedError) throw completedError
  assert.equal(completed.length, 7)
  assert.ok(completed.every((quest) => quest.status === 'completed'))
  assert.ok(completed.every((quest) => quest.progress === quest.target && quest.xp_awarded_at && quest.completed_at))
  assert.equal(completed.reduce((sum, quest) => sum + quest.xp_reward, 0), 160)
  const firstAwardTimestamps = new Map(completed.map((quest) => [quest.id, quest.xp_awarded_at]))

  const { error: repeatError } = await admin
    .from('daily_checkins')
    .update({ notes: 'Second reconciliation must not award twice.' })
    .eq('user_id', userA.id)
    .eq('checkin_date', startsOn)
  if (repeatError) throw repeatError
  const { data: repeated } = await admin
    .from('personal_quests')
    .select('id,xp_awarded_at')
    .eq('source_report_id', currentReportA.id)
  assert.ok(repeated.every((quest) => quest.xp_awarded_at === firstAwardTimestamps.get(quest.id)))

  const { data: expired } = await admin
    .from('personal_quests')
    .select('status,progress,xp_awarded_at')
    .eq('source_report_id', expiredReportA.id)
    .single()
  assert.deepEqual(expired, { status: 'expired', progress: 0, xp_awarded_at: null })

  const { error: sharedQuestReadError } = await userA.client.from('challenges').select('id').limit(1)
  assert.equal(sharedQuestReadError, null, 'existing group quest reads must remain available')

  console.log('Personal quests integration checks passed.')
} finally {
  for (const userId of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) console.error(`Failed to remove temporary test user ${userId}: ${error.message}`)
  }
}
