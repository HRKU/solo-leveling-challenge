import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush, { WebPushError } from 'web-push'

// Cron-invoked reminder sender. Two Vercel crons hit this route (see
// vercel.json): ~8:00 IST and ~20:00 IST. The slot is derived from the UTC
// hour at execution time rather than a query param, so the same path works
// for both schedules:
//   - morning: generic nudge to every subscribed device (no DB filtering)
//   - evening: streak warning, only to users with no check-in row for today
//
// Runs with the service role key (no user session on a cron request — RLS
// would block the anon key). The key never leaves this server-side route.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json(
      { error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY or VAPID_PRIVATE_KEY' },
      { status: 500 }
    )
  }

  webpush.setVapidDetails(
    'mailto:chinum.upadhyaya@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY
  )

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const slot = new Date().getUTCHours() < 12 ? 'morning' : 'evening'

  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 })
  }

  let targets = subscriptions ?? []
  if (slot === 'evening') {
    // Same UTC date-string convention the check-in flow uses.
    const today = new Date().toISOString().slice(0, 10)
    const { data: logged, error: loggedError } = await supabase
      .from('daily_checkins')
      .select('user_id')
      .eq('checkin_date', today)
    if (loggedError) {
      return NextResponse.json({ error: loggedError.message }, { status: 500 })
    }
    const loggedIds = new Set((logged ?? []).map((row) => row.user_id))
    targets = targets.filter((sub) => !loggedIds.has(sub.user_id))
  }

  const payload = JSON.stringify(
    slot === 'morning'
      ? {
          title: '⚔️ Solo Leveling Challenge',
          body: "A new day, Hunter. Log your reps, water, and sleep to earn today's XP.",
          url: '/',
        }
      : {
          title: '🔥 Your streak is on the line',
          body: 'No log yet today. Your streak resets at midnight — it takes 2 minutes.',
          url: '/',
        }
  )

  let sent = 0
  let cleaned = 0
  let failed = 0
  await Promise.allSettled(
    targets.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err) {
        // 404/410 mean the device unsubscribed (app uninstalled, permission
        // revoked) — drop the dead row so we stop paying for it.
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          cleaned++
        } else {
          failed++
        }
      }
    })
  )

  return NextResponse.json({ slot, targets: targets.length, sent, cleaned, failed })
}
