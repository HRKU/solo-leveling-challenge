# Scoring (v2)

Canonical reference for daily XP. Source of truth in code: [`lib/scoring/v2.ts`](../lib/scoring/v2.ts), habits in [`lib/scoring/habits.ts`](../lib/scoring/habits.ts), written only from [`app/actions/daily-checkins.ts`](../app/actions/daily-checkins.ts).

**Never trust a client-submitted XP value.**

## Summary

```
score_xp = round(workoutXp) + round(habitXp)
```

- **Workout XP** — effort-based sets + optional personal-best bonuses, soft-capped.
- **Habit XP** — water / sleep / steps / protein / calories vs personalized targets (unchanged capped ratios).
- Classic `REP_WEIGHTS` (pushups×1, etc.) are **not** added on top of v2 (that would double-count). Classic columns remain denormalized for calendar/compat via `aggregateClassicReps`.

## Units

- **Kilograms are canonical** for all PR comparisons and stored breakdown fields (`prevBestKg`, `todayBestKg`).
- UI may accept `lb`; convert with `lbToKg` before scoring.
- Catalogue `difficulty` (~0.1–2.0) multiplies set effort.

## Per completed set

A set counts if `reps > 0` or `durationSec > 0`.

**Set base:** `+2`

### Bodyweight / weighted reps (load ignored for volume)

```
repEffort = min(reps, 20) * 0.4
          + max(0, min(reps, 50) - 20) * 0.15
setXp = min(difficulty * (2 + repEffort), 12)
```

Reps above 50 add nothing.

### Duration / weighted duration

```
minutes = durationSec / 60
durEffort = min(minutes, 1) * 6
          + max(0, min(minutes, 5) - 1) * 2
setXp = min(difficulty * (2 + durEffort), 12)
```

Duration beyond 5 minutes per set adds nothing.

## Personal-best bonus (weighted modes only)

Once per exercise per day:

1. `todayBestKg` = max set weight that day (after lb→kg).
2. `prevBestKg` = max prior weight (kg) for that `exerciseId` on other dates (lookup window: last 90 days).
3. No prior best → bonus `0` (first logged lift is baseline).
4. If `todayBestKg > prevBestKg`:

```
rel = min((todayBestKg - prevBestKg) / prevBestKg, 0.30)
scaled = rel / 0.30
prBonus = min(20, 12 + 8 * scaled)
```

Barely beat prior ≈ **+12**; ~30% relative improvement ≈ **+20** (cap).

## Daily workout rollup

```
rawWorkout = sum(setXp) + sum(prBonus) + completionBonus
completionBonus = 5 if at least one completed set else 0

SOFT = 90, CEIL = 110
if rawWorkout <= SOFT:
  workoutXp = rawWorkout
else:
  workoutXp = min(CEIL, SOFT + (rawWorkout - SOFT) * 0.25)
```

## Habits

From [`lib/scoring/habits.ts`](../lib/scoring/habits.ts) (same caps as legacy):

| Habit | Max XP | Notes |
|---|---|---|
| Water | 24 | vs target ml |
| Sleep | 10 | vs 8h |
| Steps | 10 | vs 8,000 |
| Protein | 8 | vs target g |
| Calories | 8 | vs target (if logged) |

Linear ratio, capped at 1.0 (no overshoot bonus).

## Persistence & history

Columns on `daily_checkins` (migration `0007`):

- `scoring_version` — `null`/`1` = legacy frozen score; `2` = v2
- `score_breakdown` — JSON audit trail (`workoutXp`, `habitXp`, `prBonuses`, `perExercise`, …)

**History rule:** untouched rows keep stored `score_xp`. Saving a day again recomputes with **v2** and stamps version + breakdown. `profiles.total_xp` always via `resumTotalXp()`.

## Rollback

Set env `SCORING_VERSION=1` to force the legacy classic + extra-workout path for new writes (columns kept). Default is v2.

## Client estimates

UI “~XP” badges use `estimateWorkoutXpV2` without PR history. Server remains authoritative; optional toast when a PR bonus is awarded.

## Caps cheat-sheet

| Rule | Value |
|---|---|
| Per-set XP | ≤ 12 |
| Reps counted / set | ≤ 50 |
| Duration counted / set | ≤ 5 min |
| PR bonus / exercise / day | ≤ 20 |
| Soft workout cap | 90 |
| Hard workout ceiling | 110 |
| Habit max | ~60 |

## Smoke tests

```bash
npx tsx scripts/scoring-v2-smoke.ts
```

Post-deploy checklist: [`scripts/scoring-v2-verify.md`](../scripts/scoring-v2-verify.md).

## Legacy (v1)

`calculateDailyXP` in `lib/xp.ts` + `scoreExtraWorkoutXp` remain for rollback / reference. Prefer v2 for all new product behavior.
