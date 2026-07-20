# Scoring v2 — post-deploy verification

- [ ] New daily check-in row has `scoring_version = 2` and non-null `score_breakdown`
- [ ] Untouched legacy row (`scoring_version` null/1) still has original `score_xp`
- [ ] Editing a legacy day rewrites `scoring_version = 2`, new `score_xp`, and updates `profiles.total_xp`
- [ ] `profiles.total_xp` matches `sum(daily_checkins.score_xp) + challenge XP` (resum)
- [ ] Saving a new daily shows create success toast; updating shows update toast
- [ ] Weekly check-in create/update toasts fire; errors show `toast.error`
- [ ] Daily Essentials editors open as centered modals (not bottom sheets)
- [ ] Optional: PR day shows “New personal best — bonus XP awarded”
- [ ] Rollback: `SCORING_VERSION=1` forces legacy scoring writes without dropping columns
