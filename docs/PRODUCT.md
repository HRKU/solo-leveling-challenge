# Product surfaces

How the app is meant to work for the friend group. Pair with [`SCORING.md`](SCORING.md) for XP math.

## Daily check-in

- Route: `/` (today) and `/checkin/[date]` (backfill / edit).
- **Workout logger** — catalogue-driven sets (reps / duration / weighted). Classic pushups / pullups / squats / crunches are still stored as aggregates for calendar compatibility.
- **Daily essentials** — water, steps, protein, calories, sleep; editors open as **centered modals** (not bottom sheets).
- Save shows distinct create vs update toasts; validation / server errors use error toasts. Optional PR toast when a personal best awards bonus XP.
- Streak updates only when logging **today**; past-day edits never change streak.

## Progress (body)

- Canonical route: `/progress`.
- Weekly weigh-in and weight history live on **one** page (hero current weight + Log/Update CTA → centered modal).
- Trend chart uses **shadcn/Recharts** area chart; history table columns: Week, Weight, Change, Body fat. Green/red signals follow goal type (lose vs gain).
- Legacy `/checkin/weekly` redirects here. Nav has a single **Progress** item (no separate Weekly).

## Leaderboard

- Sorted by `total_xp` (onboarded profiles).
- **#1** gets a champion card (gold accent, crown, subtle glow animation; respects `prefers-reduced-motion`).
- Ranks 2+ keep the compact mobile cards / desktop table; “YOU” chip for the current user.

## Calendar

- Habit-completion overview; click a day to open that check-in.
- For scoring v2 rows, workout habit coloring uses `score_breakdown.workoutXp` so the calendar matches `score_xp`.

## Quests & profile

- Quests: free-text group dares; bonus XP on self-reported completion; always re-summed via `resumTotalXp`.
- Profile: edit body metrics / goal (not current weight — that comes from Progress weigh-ins). Daily push-reminder toggle per device.

## Trust boundaries

| Concern | Rule |
|---|---|
| Daily XP | Server-only in `upsertDailyCheckin` |
| Weight → targets | Only onboarding + weekly weigh-in write `current_weight_kg` |
| Total XP | Always `resumTotalXp()` — never ad-hoc increments |
| Workout payload | Validated (Zod) before score |

## What we deliberately do not score (yet)

1RM formulas, RPE, calories burned from lifts, wearable auto-import — out of scope for current MVP scoring.
