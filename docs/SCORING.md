# Scoring (v3)

Canonical reference for daily XP. Source of truth in code: [`lib/scoring/v2.ts`](../lib/scoring/v2.ts) (`scoreWorkoutV3`), habits in [`lib/scoring/habits.ts`](../lib/scoring/habits.ts), written only from [`app/actions/daily-checkins.ts`](../app/actions/daily-checkins.ts).

**Never trust a client-submitted XP value.**

## Summary

```
score_xp = round(workoutXp) + round(habitXp)
```

- **Workout XP** — uncapped `difficulty × volume` (reps or duration). Weight is **logged but never scored**.
- **Habit XP** — water / sleep / steps / protein / calories vs personalized targets (capped ratios).
- Classic `REP_WEIGHTS` are **not** added on top (would double-count). Classic columns remain denormalized via `aggregateClassicReps`.
- No per-set ceiling, no soft daily workout cap, no PR bonuses.

## Units

- Catalogue `difficulty` (~0.1–2.0) multiplies set volume.
- UI may accept `lb` for logging; scoring ignores load entirely.
- Duration rate: **6 XP per minute** at difficulty 1 (`DURATION_XP_PER_MINUTE`).

## Per completed set

A set counts if `reps > 0` or `durationSec > 0`.

### Bodyweight / weighted reps (load ignored)

```
setXp = difficulty × reps
```

### Duration / weighted duration

```
setXp = difficulty × (durationSec / 60) × 6
```

## Daily workout rollup

```
workoutXp = round(sum(setXp))
```

No completion bonus, no soft/hard ceiling. Same total reps score the same whether logged as one set or many.

## Habits

From [`lib/scoring/habits.ts`](../lib/scoring/habits.ts):

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

- `scoring_version` — `null`/`1` = legacy; `2` = historical capped+PR; `3` = volume (current)
- `score_breakdown` — JSON audit (`workoutXp`, `habitXp`, `rawWorkout`, `perExercise`)

**Production status:** existing check-ins were backfilled with [`scripts/rescore-v3.ts`](../scripts/rescore-v3.ts) `--apply` and every profile was re-summed via `resumTotalXp()`. Live rows should be `scoring_version = 3`. Re-running the script is idempotent (safe to dry-run anytime).

**Backfill caveats (observed):**

- Days with only classic columns (no `workout_entries`) rescore from pushups/pullups/squats/crunches only.
- Habit XP uses **current** profile weight/goal for targets, so a day can move by a few points even when workout volume is unchanged (habit “target drift”).
- Soft-capped / set-capped v2 days can jump a lot when uncapped; leaderboard order can change.

`profiles.total_xp` always via `resumTotalXp()`.

## Rollback

Set env `SCORING_VERSION=1` to force the legacy classic + extra-workout path for new writes (columns kept). Default is v3.

## Client estimates

UI “~XP” badges use `estimateWorkoutXpV3` / `estimateWorkoutXp` — same formula as the server (no PR path).

## Caps cheat-sheet

| Rule | Value |
|---|---|
| Per-set / daily workout XP | **uncapped** (input Zod limits only) |
| Duration XP / min @ diff 1 | 6 |
| Habit max | ~60 |
| Weight → XP | none (logging only) |

## Smoke tests

```bash
npx tsx scripts/scoring-v3-smoke.ts
```

Post-deploy / backfill checklist: [`scripts/scoring-v3-verify.md`](../scripts/scoring-v3-verify.md).

## Legacy

- **v1:** `calculateDailyXP` + `scoreExtraWorkoutXp` (rollback via `SCORING_VERSION=1`).
- **v2:** effort curves + soft cap 90→110 + PR bonuses — superseded; production rows were rescored to v3.
