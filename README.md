# Solo Leveling Challenge

A gamified fitness-challenge tracker for a friend group, replacing a shared Excel sheet. Log a daily check-in (workout, water, sleep, steps, protein, calories) and a weekly weigh-in; your consistency and effort convert into XP, a level, and a Hunter rank (E → S), all visible on a shared leaderboard.

Themed after *Solo Leveling* — daily targets are personalized per person (BMR/TDEE-based), your score is computed server-side so it can't be gamed, and a streak survives as long as you log *something* each day, even a rough one.

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router, Turbopack, React 19) + TypeScript
- **[Supabase](https://supabase.com)** — Postgres, email/password Auth, and Row Level Security
- **[Tailwind CSS v4](https://tailwindcss.com)** + **[shadcn/ui](https://ui.shadcn.com)** (Base UI primitives)
- **[Vercel](https://vercel.com)** for hosting

## Project structure

```
app/
  actions/            Server Actions — the only place data gets written
    auth.ts             sign up / log in / sign out
    onboarding.ts        completes profile setup, gated by profiles.onboarded
    daily-checkins.ts    the entire XP trust boundary lives here
    weekly-checkins.ts   weight check-in, syncs profiles.current_weight_kg
  login/ signup/ onboarding/    pre-app auth screens
  page.tsx                     "/" — dashboard: today's check-in + rank/XP/streak
  calendar/                    habit-completion calendar
  leaderboard/                 group leaderboard
  checkin/weekly/ progress/    weekly weigh-in + weight trend

components/            UI components (components/ui/ = shadcn primitives)
lib/
  supabase/             browser/server Supabase clients + the proxy session helper
  targets.ts            BMR/TDEE/protein/water target formulas
  xp.ts                 scoring formula, level/rank curve, streak logic
  types.ts              shared TypeScript types

proxy.ts                Next.js 16's renamed "middleware" — session refresh,
                        auth gate, and the onboarding gate

supabase/migrations/    SQL schema, RLS policies, and the profile-creation trigger
```

### How scoring works (see `lib/xp.ts` and `lib/targets.ts`)

- Daily targets (calories, protein, water) are computed per person from age/sex/height/weight/goal via Mifflin-St Jeor BMR × activity factor. Sleep (8h) and steps (8,000) are fixed for everyone.
- A day's XP is a 0–100 score: workout done (40 pts) > water (24) > sleep + steps (10 + 10) > protein + calories (8 + 8), with partial credit for hitting a fraction of a numeric target. It's computed **server-side only** in `app/actions/daily-checkins.ts` — never trust a client-submitted XP value.
- Level requires 26×N more XP each level; ranks are E (1–3), D (4–7), C (8–12), B (13–17), A (18–23), S (24+).
- A streak only breaks if a day has **no check-in row at all** — a logged-but-rough day still counts.

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
2. Paste the full contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and run it.

This creates the `profiles`, `daily_checkins`, and `weekly_checkins` tables, all Row Level Security policies, and the trigger that auto-creates a profile row on signup.

### 4. Configure environment variables

In the Supabase dashboard, go to **Settings → API** and copy the **Project URL** and **anon public key**. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

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

## Deployment

This project deploys to Vercel. Two ways to do it:

- **Git-connected (recommended)**: the Vercel project is connected to this GitHub repo — pushing to `main` (the default/production branch) triggers an automatic deploy. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under the Vercel project's **Settings → Environment Variables** first, and make sure **Settings → Git → Production Branch** is set to `main`.
- **Manual CLI deploy**: `npx vercel --prod` from the project root (requires `npx vercel login` once).

## Branches

- `main` — default, stable, deployed branch. This is what Vercel builds from.
- `dev` — active development branch for work in progress before it merges to `main`.
