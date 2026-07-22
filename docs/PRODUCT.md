# Product surfaces

How the app is meant to work for the friend group. Pair with [`SCORING.md`](SCORING.md) for XP math.

## Dashboard

- `/` opens with `DashboardHero` — a rank-tinted hero card (`RANK_HERO_BG`/`RANK_BAR_GRADIENT` in `RankBadge.tsx`) replacing a flat card: rank medallion + streak, then a single XP progress bar (the shared `Progress` primitive previously always rendered a default track *and* any custom children, doubling the bar — fixed in `components/ui/progress.tsx`) tinted to the hunter's current rank, with an "X XP to Level N+1" caption underneath.

## Daily check-in

- Route: `/` (today) and `/checkin/[date]` (backfill / edit).
- **Workout logger** — catalogue-driven sets (reps / duration / weighted). Picker and set editor open as **centered modals** (component may still be named `BottomSheet`). Classic pushups / pullups / squats / crunches are still stored as aggregates for calendar compatibility.
- **Daily essentials** — water, steps, protein, calories, sleep; editors also open as **centered modals** (not bottom sheets). Form posts `waterMl`; display may show L when ≥1 L.
- **Backfill date picker** (`DateSelectModal`) — no native `<input type="date">` (poor contrast / accidental-navigate on mobile). `/` shows a "Missed a day?" trigger → centered modal with a full calendar grid + prominent date preview; navigation to `/checkin/[date]` only fires on **Continue**, never on selecting a day or opening the picker. Future dates are disabled. `/checkin/[date]` shows a "Logging <Weekday, D Month[, Year]>" heading (`lib/date-format.ts`) plus a **Change date** button that reopens the same modal without leaving the page.
- Save shows distinct create vs update toasts; validation / server errors use error toasts.
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
- Totals follow scoring **v3** (uncapped volume). After the historical rescore, ranks can differ from the old soft-capped / PR era — that is expected.

## Calendar

- Card header shows the month, overall streak (`StreakFlame`), and two chips — days logged vs. elapsed and XP earned this month — derived from the same month's `checkins` the grid already renders (no extra fetch, purely presentational).
- Habit-completion overview. Dot colors/sizes (status + priority) are unchanged; only surrounding chrome (cell radius, today ring, hover/tap feedback, legend layout) was restyled. Click behavior depends on the day (`CalendarDayModal`):
  - **Today** — navigates straight to its check-in (same page as `/`), no modal.
  - **Future** — disabled, not clickable.
  - **Past, no check-in** — confirm modal: prominent date (`lib/date-format.ts`'s `formatFullCheckinDate`, always includes the year), "Log this day" / "Cancel". Only navigates to `/checkin/[date]` on confirm.
  - **Past, has a check-in** — read-only day-details modal: status badge (Completed vs Partial, from the same habit breakdown as the dots) + stored XP, workout entries (exercise + `summarizeEntry` sets/reps/duration/weight), water/steps/protein/calories/sleep, notes, and an **Edit check-in** button to `/checkin/[date]`.
- For scoring v3 rows (and any remaining v2), workout habit coloring — and the modal's Completed/Partial read — uses `score_breakdown.workoutXp` so the calendar, modal, and `score_xp` can never disagree.
- Opening/viewing the modal never touches the streak; only submitting the check-in form does (and only for today).

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

## What we deliberately do not score

Load/weight on the bar (logged only), PR bonuses, 1RM formulas, RPE, calories burned from lifts, wearable auto-import.
