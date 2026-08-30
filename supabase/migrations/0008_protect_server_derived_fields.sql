-- Protect fields that are calculated or controlled by trusted Server Actions.
-- RLS limits which rows a member can change; these column grants additionally
-- limit which values they can change through Supabase's public Data API.

-- A member may edit normal profile inputs, but not progression/onboarding state.
revoke update on table public.profiles from authenticated;
grant update (
  display_name,
  name,
  age,
  sex,
  height_cm,
  starting_weight_kg,
  current_weight_kg,
  goal_type,
  target_weight_kg
) on table public.profiles to authenticated;

-- A member may submit the raw facts of their own check-in. XP and its audit
-- metadata can only be written by the server-side scoring path (service role).
revoke insert, update on table public.daily_checkins from authenticated;
grant insert (
  user_id,
  checkin_date,
  workout_done,
  workout_type,
  duration_minutes,
  calories,
  protein_g,
  water_ml,
  sleep_hours,
  steps,
  notes,
  pushups,
  pullups,
  crunches,
  squats,
  workout_entries
) on table public.daily_checkins to authenticated;
grant update (
  checkin_date,
  workout_done,
  workout_type,
  duration_minutes,
  calories,
  protein_g,
  water_ml,
  sleep_hours,
  steps,
  notes,
  pushups,
  pullups,
  crunches,
  squats,
  workout_entries
) on table public.daily_checkins to authenticated;

comment on column public.profiles.total_xp is
  'Server-derived. Direct writes by authenticated Data API clients are revoked.';
comment on column public.daily_checkins.score_xp is
  'Server-derived. Direct writes by authenticated Data API clients are revoked.';
