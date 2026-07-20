-- Persist set-based workout logger payload without altering historical
-- classic rep columns (pushups/pullups/squats/crunches), which remain the
-- denormalized XP inputs for those catalog exercise ids.
alter table public.daily_checkins
  add column if not exists workout_entries jsonb;

comment on column public.daily_checkins.workout_entries is
  'Optional JSON array of workout entries (exerciseId, sets, weightUnit, notes). Null for legacy rows.';
