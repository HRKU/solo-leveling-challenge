# Solo Leveling Challenge

A gamified fitness-challenge tracker for a friend group, replacing a shared Excel sheet. Log a daily check-in (workout sets + habits: water, sleep, steps, protein, calories) and a weekly weigh-in on Progress; consistency and effort convert into XP, a level, and a Hunter rank (E → S), all visible on a shared leaderboard.

Themed after *Solo Leveling* — daily targets are personalized per person (BMR/TDEE-based), your score is computed server-side so it can't be gamed, and a streak survives as long as you log *something* each day, even a rough one.

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router, Turbopack, React 19) + TypeScript
- **[Supabase](https://supabase.com)** — Postgres, email/password Auth, and Row Level Security
- **[Tailwind CSS v4](https://tailwindcss.com)** + **[shadcn/ui](https://ui.shadcn.com)** (Base UI primitives)
- **[Vercel](https://vercel.com)** for hosting

## Project structure

```
app/
  actions/            Server Actions — preferred place data gets written
    auth.ts             sign up / log in / sign out
    onboarding.ts        completes profile setup, gated by profiles.onboarded
    daily-checkins.ts    the entire XP trust boundary lives here (scoring v3)
    weekly-checkins.ts   weigh-in upsert; syncs profiles.current_weight_kg
    challenges.ts        post a quest, toggle your own completion
    profile.ts           edit profile fields (not weight — see Progress)
    push.ts              save/delete per-device push subscriptions
  api/reminders/        cron-only route — sends morning/evening push (not user CRUD)
  login/ signup/ onboarding/    pre-app auth screens
  page.tsx                     "/" — dashboard: today's check-in + rank/XP/streak
  calendar/                    habit-completion calendar (click a day to backfill it)
  leaderboard/                 group leaderboard (#1 champion card)
  progress/                    body hub: weigh-in modal + weight trend (shadcn chart)
  checkin/weekly/              redirects → /progress (legacy URL)
  checkin/[date]/              backfill/edit a past day's check-in
  quests/                      group dares — free-text challenges, bonus XP on completion
  profile/                     edit profile + daily-reminders toggle

components/            UI (components/ui/ = shadcn; components/workout/ = logger modals)
lib/
  supabase/             browser/server Supabase clients + the proxy session helper
  scoring/              v3 volume formula + habit XP (see docs/SCORING.md)
  exercise-catalog.ts   seeded exercise list for the workout logger
  workout-logger.ts     entry/set helpers, classic aggregates, client XP estimate
  targets.ts            BMR/TDEE/protein/water target formulas
  xp.ts                 level/rank curve, streak, calendar helpers; legacy calculateDailyXP
  xp-resum.ts            single source-of-truth recomputation of total_xp
  week.ts               UTC Monday week-start helper
  types.ts              shared TypeScript types
  validation/           Zod check-in / search sanitization

docs/
  PRODUCT.md            product surfaces & UX contracts
  SCORING.md            scoring v3 formula (canonical)

proxy.ts                Next.js 16's renamed "middleware" — session refresh,
                        auth gate, and the onboarding gate (excludes api/, sw.js,
                        and the web manifest)

public/sw.js            service worker — push display only (no offline cache)
vercel.json             Vercel cron schedules for /api/reminders

supabase/migrations/    SQL schema, RLS policies, and the profile-creation trigger
```

### How scoring works

See **[`docs/SCORING.md`](docs/SCORING.md)** for the full v3 formula. Short version:

- **Default path (v3):** uncapped workout XP = catalogue `difficulty × reps` (or duration × 6 XP/min). Weight is logged only — it does not affect score. No PR bonuses, no soft daily workout cap. Plus capped habit XP. Written server-side in `upsertDailyCheckin` with `scoring_version` + `score_breakdown`.
- **Habits:** water 24, sleep 10, steps 10, protein 8, calories 8 — ratio-capped vs targets ([`lib/targets.ts`](lib/targets.ts)).
- **Do not** stack classic `REP_WEIGHTS` on top of v3 workout XP. Classic columns remain denormalized for calendar/compat.
- Level requires 52×N more XP each level; ranks are E (1–3), D (4–7), C (8–12), B (13–17), A (18–23), S (24+).
- A streak only breaks if a day has **no check-in row at all**. Backfills never touch the streak.
- **Quests** are a second XP source; `total_xp` always comes from `resumTotalXp()` (daily scores + completed quests), never an incremental patch.
- **Historical rescore:** production check-ins were migrated with `scripts/rescore-v3.ts --apply` (idempotent; dry-run anytime). See caveats in [`docs/SCORING.md`](docs/SCORING.md).
- Rollback flag: `SCORING_VERSION=1` forces the legacy scoring path for new writes.

Product UX (check-in, Progress hub, leaderboard champion, etc.): **[`docs/PRODUCT.md`](docs/PRODUCT.md)**.

## First-time setup

### Prerequisites

- Node.js **20.9+** (Next.js 16's minimum — an LTS release is recommended)
- npm
- A free [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account, if you want to deploy (optional for local dev)

### 1. Clone and install

```bash
git clone https://github.com/HRKU/solo-leveling-challenge.git
cd solo-leveling-challenge
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project** (any name/region/database password).
2. Once it's provisioned, go to **Authentication → Providers → Email** and turn **off** "Confirm email". This lets sign-up return an active session immediately — recommended for a small trusted group; re-enable it later if you want strict email verification.

### 3. Apply the database schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste and run the migrations in order:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   - [`supabase/migrations/0002_exercise_reps.sql`](supabase/migrations/0002_exercise_reps.sql) (per-exercise rep-count columns)
   - [`supabase/migrations/0003_challenges.sql`](supabase/migrations/0003_challenges.sql) (quests + completions)
   - [`supabase/migrations/0004_push_subscriptions.sql`](supabase/migrations/0004_push_subscriptions.sql) (push reminder subscriptions)
   - [`supabase/migrations/0005_reps_squats_drop_situps.sql`](supabase/migrations/0005_reps_squats_drop_situps.sql) (merge situps → crunches, add squats)
   - [`supabase/migrations/0006_workout_entries.sql`](supabase/migrations/0006_workout_entries.sql) (`workout_entries` jsonb on daily check-ins)
   - [`supabase/migrations/0007_scoring_version.sql`](supabase/migrations/0007_scoring_version.sql) (`scoring_version` + `score_breakdown`)

This creates the `profiles`, `daily_checkins`, `weekly_checkins`, `challenges` / `challenge_completions`, and `push_subscriptions` tables, all Row Level Security policies, and the trigger that auto-creates a profile row on signup.

### 4. Configure environment variables

In the Supabase dashboard, go to **Settings → API** and copy the **Project URL** and **anon public key**. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Those two are enough for local login/check-ins. To exercise push reminders locally you also need the VAPID/cron/service-role vars listed under [Push notification reminders](#push-notification-reminders) (already set in Vercel production).

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, complete onboarding (this is required — there are no fake default body-metric values), and start logging.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |
| `npx tsx scripts/scoring-v3-smoke.ts` | Scoring v3 formula smoke tests |
| `npx tsx --env-file=.env.local scripts/rescore-v3.ts` | Dry-run historical rescore to v3 |
| `npx tsx --env-file=.env.local scripts/rescore-v3.ts --apply` | Apply rescore + resum all users |

## Installable app (PWA)

The app ships a web manifest ([app/manifest.ts](app/manifest.ts)) and icon set, so it can be installed to a phone's home screen and launches fullscreen like a native app:

- **Android (Chrome)**: browser menu → **Install app** (or "Add to Home screen").
- **iPhone (Safari)**: Share → **Add to Home Screen**.

Icons are generated by `node scripts/generate-icons.mjs` (outputs to `public/` and `app/apple-icon.png`) — re-run it after changing the design. A service worker (`public/sw.js`) exists for **push notifications only** — there is still no offline caching or queued check-ins.

## Push notification reminders

Two Vercel cron jobs ([vercel.json](vercel.json)) hit `/api/reminders` daily — ~8:00 IST (generic morning nudge to every subscribed device) and ~20:00 IST (streak warning, only to users with no check-in for the day). Users opt in per device via the **Daily reminders** toggle on `/profile`; subscriptions live in the `push_subscriptions` table (migration `0004`). The service worker ([public/sw.js](public/sw.js)) handles push display only — no offline caching.

Required env vars (all set in Vercel production):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key, used by the browser to subscribe |
| `VAPID_PRIVATE_KEY` | VAPID private key, used by the sender (server-only) |
| `CRON_SECRET` | Vercel sends it as a Bearer token on cron invocations; the route rejects everything else |
| `SUPABASE_SERVICE_ROLE_KEY` | Lets the cron sender read subscriptions without a user session (server-only, bypasses RLS) |

Regenerate VAPID keys with `npx web-push generate-vapid-keys` (invalidates all existing subscriptions). Test a send manually: `curl -H "Authorization: Bearer $CRON_SECRET" https://<deployment>/api/reminders`. iPhone users must install the PWA (iOS 16.4+) before the toggle works; Android works in-browser or installed.

## Deployment

This project deploys to Vercel. Two ways to do it:

- **Git-connected (recommended)**: the Vercel project is connected to this GitHub repo — pushing to `main` (the default/production branch) triggers an automatic deploy. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under the Vercel project's **Settings → Environment Variables** first, and make sure **Settings → Git → Production Branch** is set to `main`.
- **Manual CLI deploy**: `npx vercel --prod` from the project root (requires `npx vercel login` once).

## Branches

- `main` — default, stable, deployed branch. This is what Vercel builds from.
- `dev` — active development branch for work in progress before it merges to `main`.
