-- Add beginner-friendly structured workout-volume quest variants.

alter table public.personal_quests
  drop constraint personal_quests_quest_type_check,
  drop constraint personal_quests_target_check;

alter table public.personal_quests
  add constraint personal_quests_quest_type_check check (
    quest_type in (
      'checkin_days', 'workout_days', 'habit_target_days', 'exercise_sessions',
      'exercise_total_reps', 'exercise_total_sets', 'exercise_total_duration'
    )
  ),
  add constraint personal_quests_target_check check (target between 1 and 10000);

create or replace function private.reconcile_personal_quests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform quest.id
  from public.personal_quests as quest
  where quest.user_id = new.user_id and quest.status = 'active'
  order by quest.id
  for update;

  update public.personal_quests as quest
  set progress = least(quest.target, case quest.quest_type
    when 'checkin_days' then (
      select count(*)::integer from public.daily_checkins as checkin
      where checkin.user_id = quest.user_id and checkin.checkin_date between quest.starts_on and quest.ends_on
    )
    when 'workout_days' then (
      select count(*)::integer from public.daily_checkins as checkin
      where checkin.user_id = quest.user_id and checkin.checkin_date between quest.starts_on and quest.ends_on and checkin.workout_done
    )
    when 'habit_target_days' then (
      select count(*)::integer from public.daily_checkins as checkin
      where checkin.user_id = quest.user_id
        and checkin.checkin_date between quest.starts_on and quest.ends_on
        and case quest.parameters ->> 'habit'
          when 'water_ml' then checkin.water_ml >= (quest.parameters ->> 'dailyTarget')::numeric
          when 'sleep_hours' then checkin.sleep_hours >= (quest.parameters ->> 'dailyTarget')::numeric
          when 'steps' then checkin.steps >= (quest.parameters ->> 'dailyTarget')::numeric
          when 'protein_g' then checkin.protein_g >= (quest.parameters ->> 'dailyTarget')::numeric
          else false
        end
    )
    when 'exercise_sessions' then (
      select count(*)::integer from public.daily_checkins as checkin
      where checkin.user_id = quest.user_id
        and checkin.checkin_date between quest.starts_on and quest.ends_on
        and exists (
          select 1 from jsonb_array_elements(case when jsonb_typeof(checkin.workout_entries) = 'array' then checkin.workout_entries else '[]'::jsonb end) as entry
          where entry ->> 'exerciseId' = quest.parameters ->> 'exerciseId'
            and exists (
              select 1 from jsonb_array_elements(case when jsonb_typeof(entry -> 'sets') = 'array' then entry -> 'sets' else '[]'::jsonb end) as workout_set
              where coalesce((workout_set ->> 'reps')::numeric, 0) > 0 or coalesce((workout_set ->> 'durationSec')::numeric, 0) > 0
            )
        )
    )
    when 'exercise_total_reps' then (
      select coalesce(sum(coalesce((workout_set ->> 'reps')::numeric, 0)), 0)::integer
      from public.daily_checkins as checkin
      cross join lateral jsonb_array_elements(case when jsonb_typeof(checkin.workout_entries) = 'array' then checkin.workout_entries else '[]'::jsonb end) as entry
      cross join lateral jsonb_array_elements(case when jsonb_typeof(entry -> 'sets') = 'array' then entry -> 'sets' else '[]'::jsonb end) as workout_set
      where checkin.user_id = quest.user_id and checkin.checkin_date between quest.starts_on and quest.ends_on
        and entry ->> 'exerciseId' = quest.parameters ->> 'exerciseId'
    )
    when 'exercise_total_sets' then (
      select count(*)::integer
      from public.daily_checkins as checkin
      cross join lateral jsonb_array_elements(case when jsonb_typeof(checkin.workout_entries) = 'array' then checkin.workout_entries else '[]'::jsonb end) as entry
      cross join lateral jsonb_array_elements(case when jsonb_typeof(entry -> 'sets') = 'array' then entry -> 'sets' else '[]'::jsonb end) as workout_set
      where checkin.user_id = quest.user_id and checkin.checkin_date between quest.starts_on and quest.ends_on
        and entry ->> 'exerciseId' = quest.parameters ->> 'exerciseId'
        and (coalesce((workout_set ->> 'reps')::numeric, 0) > 0 or coalesce((workout_set ->> 'durationSec')::numeric, 0) > 0)
    )
    when 'exercise_total_duration' then (
      select floor(coalesce(sum(coalesce((workout_set ->> 'durationSec')::numeric, 0)), 0) / 60)::integer
      from public.daily_checkins as checkin
      cross join lateral jsonb_array_elements(case when jsonb_typeof(checkin.workout_entries) = 'array' then checkin.workout_entries else '[]'::jsonb end) as entry
      cross join lateral jsonb_array_elements(case when jsonb_typeof(entry -> 'sets') = 'array' then entry -> 'sets' else '[]'::jsonb end) as workout_set
      where checkin.user_id = quest.user_id and checkin.checkin_date between quest.starts_on and quest.ends_on
        and entry ->> 'exerciseId' = quest.parameters ->> 'exerciseId'
    )
    else 0
  end)
  where quest.user_id = new.user_id and quest.status = 'active';

  update public.personal_quests as quest
  set status = 'completed', progress = quest.target, completed_at = now(), xp_awarded_at = now()
  where quest.user_id = new.user_id and quest.status = 'active'
    and current_date between quest.starts_on and quest.ends_on and quest.progress >= quest.target;

  update public.personal_quests as quest
  set status = 'expired'
  where quest.user_id = new.user_id and quest.status = 'active' and current_date > quest.ends_on;

  return new;
end;
$$;

comment on function private.reconcile_personal_quests() is
  'Recalculates day, habit, exercise-session, rep, set, and duration quests and records one-time completion XP.';
