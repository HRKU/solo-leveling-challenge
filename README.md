# Solo Leveling Challenge

A gamified fitness-challenge tracker for a friend group, replacing a shared Excel sheet. Log a daily check-in (push-ups, pull-ups, squats, crunches, water, sleep, steps, protein, calories) and a weekly weigh-in; your consistency and effort convert into XP, a level, and a Hunter rank (E → S), all visible on a shared leaderboard.

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
    daily-checkins.ts    the entire XP trust boundary lives here
    weekly-checkins.ts   weight check-in, syncs profiles.current_weight_kg
    challenges.ts        post a quest, toggle your own completion
    profile.ts           edit profile fields (not weight — see below)
    push.ts              save/delete per-device push subscriptions
  api/reminders/        cron-only route — sends morning/evening push (not user CRUD)
  login/ signup/ onboarding/    pre-app auth screens
  page.tsx                     "/" — dashboard: today's check-in + rank/XP/streak
  calendar/                    habit-completion calendar (click a day to backfill it)
  leaderboard/                 group leaderboard
  checkin/weekly/ progress/    weekly weigh-in + weight trend
  checkin/[date]/              backfill/edit a past day's check-in
  quests/                      group dares — free-text challenges, bonus XP on completion
  profile/                     edit profile + daily-reminders toggle

components/            UI components (components/ui/ = shadcn primitives)
lib/
  supabase/             browser/server Supabase clients + the proxy session helper
  targets.ts            BMR/TDEE/protein/water target formulas
  xp.ts                 scoring formula, level/rank curve, streak logic
  xp-resum.ts            single source-of-truth recomputation of total_xp —
                         every XP source (daily check-ins, completed quests)
                         must be added here, never given its own increment path
  types.ts              shared TypeScript types

proxy.ts                Next.js 16's renamed "middleware" — session refresh,
                        auth gate, and the onboarding gate (excludes api/, sw.js,
                        and the web manifest)

public/sw.js            service worker — push display only (no offline cache)
vercel.json             Vercel cron schedules for /api/reminders

supabase/migrations/    SQL schema, RLS policies, and the profile-creation trigger
```

### How scoring works (see `lib/xp.ts` and `lib/targets.ts`)

- Daily targets (calories, protein, water) are computed per person from age/sex/height/weight/goal via Mifflin-St Jeor BMR × activity factor. Sleep (8h) and steps (8,000) are fixed for everyone.
- A day's XP = **reps (uncapped)** + water/sleep/steps/protein/calories (capped, partial credit for hitting a fraction of target). Reps are scored per exercise, no daily ceiling: push-ups ×1, pull-ups ×2, squats ×1, crunches ×0.5 — more reps always means more XP. Water (up to 24) and steps (up to 10 toward 8,000) already reward logging those habits; sleep (10) and protein + calories (8 + 8) use the same capped style. It's computed **server-side only** in `app/actions/daily-checkins.ts` — never trust a client-submitted XP value.
- Level requires 52×N more XP each level; ranks are E (1–3), D (4–7), C (8–12), B (13–17), A (18–23), S (24+). A genuinely high-volume day can push well past what the old flat-scoring model topped out at — that's intentional; grinding is meant to be rewarded without a ceiling.
- A streak only breaks if a day has **no check-in row at all** — a logged-but-rough day still counts. Backfilling a past day (via the calendar or the dashboard's date picker) never touches the streak — it's pure historical record-keeping that still counts toward `total_xp`.
- **Quests** (`/quests`) are a second XP source — free-text group dares with a creator-set bonus XP reward, completed via a self-reported toggle. `total_xp` is always the result of `lib/xp-resum.ts`'s `resumTotalXp()`, which re-sums *both* daily check-ins and completed quests from scratch every time — never an incremental adjustment, so toggling a quest on and back off can't be exploited for free XP.

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
