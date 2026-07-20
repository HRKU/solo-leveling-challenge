-- Additive scoring metadata for v2. Does not backfill or alter existing score_xp.
alter table public.daily_checkins
  add column if not exists scoring_version smallint,
  add column if not exists score_breakdown jsonb;

comment on column public.daily_checkins.scoring_version is
  'null/1 = legacy frozen score; 2 = effort-based v2';

comment on column public.daily_checkins.score_breakdown is
  'JSON audit trail for v2 scoring (workoutXp, habitXp, prBonuses, etc.)';
