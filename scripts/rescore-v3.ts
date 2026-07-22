/**
 * One-shot historical rescore to scoring v3 (uncapped difficulty × volume).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/rescore-v3.ts          # dry-run
 *   npx tsx --env-file=.env.local scripts/rescore-v3.ts --apply  # write
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js'
import { calculateDailyTargets, type GoalType, type Sex } from '../lib/targets'
import { calculateHabitXp } from '../lib/scoring/habits'
import {
  SCORING_VERSION_V3,
  buildScoreBreakdown,
  scoreWorkoutV3,
} from '../lib/scoring/v2'
import { hydrateWorkoutEntries, type WorkoutEntry } from '../lib/workout-logger'
import { resumTotalXp } from '../lib/xp-resum'

const APPLY = process.argv.includes('--apply')
const PAGE = 200

type CheckinRow = {
  id: string
  user_id: string
  checkin_date: string
  pushups: number | null
  pullups: number | null
  squats: number | null
  crunches: number | null
  water_ml: number | null
  sleep_hours: number | null
  steps: number | null
  protein_g: number | null
  calories: number | null
  workout_entries: WorkoutEntry[] | null
  score_xp: number
  scoring_version: number | null
}

type ProfileRow = {
  id: string
  age: number | null
  sex: Sex | null
  height_cm: number | null
  current_weight_kg: number | null
  goal_type: GoalType | null
  total_xp: number
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  console.log(APPLY ? 'MODE: APPLY (writes enabled)' : 'MODE: DRY-RUN (no writes)')

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, age, sex, height_cm, current_weight_kg, goal_type, total_xp')
    .returns<ProfileRow[]>()

  if (profileError) throw profileError

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  const userDeltas = new Map<string, { old: number; neu: number; rows: number }>()

  let offset = 0
  let totalRows = 0
  let changedRows = 0

  for (;;) {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select(
        'id, user_id, checkin_date, pushups, pullups, squats, crunches, water_ml, sleep_hours, steps, protein_g, calories, workout_entries, score_xp, scoring_version'
      )
      .order('checkin_date', { ascending: true })
      .range(offset, offset + PAGE - 1)
      .returns<CheckinRow[]>()

    if (error) throw error
    const rows = data ?? []
    if (rows.length === 0) break

    for (const row of rows) {
      totalRows++
      const profile = profileById.get(row.user_id)
      if (
        !profile ||
        profile.age == null ||
        !profile.sex ||
        profile.height_cm == null ||
        profile.current_weight_kg == null ||
        !profile.goal_type
      ) {
        console.warn(`skip ${row.id} (${row.checkin_date}): profile incomplete for ${row.user_id}`)
        continue
      }

      const targets = calculateDailyTargets({
        age: profile.age,
        sex: profile.sex,
        heightCm: profile.height_cm,
        currentWeightKg: profile.current_weight_kg,
        goalType: profile.goal_type,
      })

      const entries = hydrateWorkoutEntries(row)
      const workout = scoreWorkoutV3(entries)
      const habitXp = calculateHabitXp(
        {
          waterMl: row.water_ml,
          sleepHours: row.sleep_hours,
          steps: row.steps,
          proteinG: row.protein_g,
          calories: row.calories,
        },
        targets
      )
      const scoreXp = workout.workoutXp + habitXp
      const breakdown = buildScoreBreakdown(workout, habitXp)

      const delta = scoreXp - row.score_xp
      const agg = userDeltas.get(row.user_id) ?? { old: 0, neu: 0, rows: 0 }
      agg.old += row.score_xp
      agg.neu += scoreXp
      agg.rows++
      userDeltas.set(row.user_id, agg)

      if (delta !== 0 || row.scoring_version !== SCORING_VERSION_V3) {
        changedRows++
        if (!APPLY) {
          console.log(
            `${row.checkin_date} user=${row.user_id.slice(0, 8)}… ${row.score_xp} → ${scoreXp} (Δ ${delta >= 0 ? '+' : ''}${delta}) v=${row.scoring_version}`
          )
        } else {
          const { error: upErr } = await supabase
            .from('daily_checkins')
            .update({
              score_xp: scoreXp,
              scoring_version: SCORING_VERSION_V3,
              score_breakdown: breakdown,
            })
            .eq('id', row.id)
          if (upErr) throw upErr
        }
      }
    }

    if (rows.length < PAGE) break
    offset += PAGE
  }

  console.log(`\nCheck-ins scanned: ${totalRows}, rows needing update: ${changedRows}`)
  console.log('\nPer-user daily XP sum (before → after):')
  for (const [userId, d] of userDeltas) {
    const profile = profileById.get(userId)
    console.log(
      `  ${userId.slice(0, 8)}… rows=${d.rows} daily ${d.old} → ${d.neu} (Δ ${d.neu - d.old >= 0 ? '+' : ''}${d.neu - d.old}) profile.total_xp=${profile?.total_xp ?? '?'}`
    )
  }

  if (APPLY) {
    console.log('\nRe-summing profiles.total_xp …')
    for (const userId of userDeltas.keys()) {
      const { totalXp, level, rank } = await resumTotalXp(supabase, userId)
      const { error: pErr } = await supabase
        .from('profiles')
        .update({ total_xp: totalXp, level, rank })
        .eq('id', userId)
      if (pErr) throw pErr
      console.log(`  ${userId.slice(0, 8)}… total_xp=${totalXp} level=${level} rank=${rank}`)
    }
    console.log('Done.')
  } else {
    console.log('\nDry-run only. Re-run with --apply to write.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
