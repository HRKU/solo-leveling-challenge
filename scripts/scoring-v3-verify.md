# Scoring v3 — verification

Initial production backfill (`scripts/rescore-v3.ts --apply`) has been run: check-ins stamped `scoring_version = 3`, profiles re-summed.

## Ongoing checks

- [x] Historical rescore applied + `profiles.total_xp` re-summed
- [ ] New daily check-in row has `scoring_version = 3` and non-null `score_breakdown` (no `prBonuses`)
- [ ] Soft-cap / PR no longer applied: high-volume day can exceed 110 workout XP
- [ ] Same total reps score the same whether logged as 1 set or many sets
- [ ] Weight on sets is stored but does not change XP
- [ ] Saving a new daily shows create/update toasts (no PR toast)
- [ ] Optional dry-run anytime: `npx tsx --env-file=.env.local scripts/rescore-v3.ts` (should show little/no drift if already on v3)
- [ ] Rollback still works if needed: `SCORING_VERSION=1` forces legacy scoring writes without dropping columns

## Known backfill effects

- Large positive deltas = days that were soft-/set-capped under v2, now uncapped volume.
- Small ± deltas with unchanged workouts = habit XP recomputed with **current** body targets (target drift).
