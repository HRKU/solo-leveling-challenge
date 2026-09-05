-- Reconcile private quest progress in the same transaction as each check-in.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.reconcile_personal_quests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Consistent lock ordering serializes concurrent check-ins for this user's
  -- active quests and protects the one-time completion timestamp.
  perform quest.id
  from public.personal_quests as quest
  where quest.user_id = new.user_id
    and quest.status = 'active'
  order by quest.id
  for update;

  update public.personal_quests as quest
  set progress = least(
    quest.target,
    (
      select count(*)::integer
      from public.daily_checkins as checkin
      where checkin.user_id = quest.user_id
        and checkin.checkin_date between quest.starts_on and quest.ends_on
        and case quest.quest_type
          when 'checkin_days' then true
          when 'workout_days' then checkin.workout_done
          when 'habit_target_days' then
            case quest.parameters ->> 'habit'
              when 'water_ml' then checkin.water_ml >= (quest.parameters ->> 'dailyTarget')::numeric
              when 'sleep_hours' then checkin.sleep_hours >= (quest.parameters ->> 'dailyTarget')::numeric
              when 'steps' then checkin.steps >= (quest.parameters ->> 'dailyTarget')::numeric
              when 'protein_g' then checkin.protein_g >= (quest.parameters ->> 'dailyTarget')::numeric
              else false
            end
          when 'exercise_sessions' then exists (
            select 1
            from jsonb_array_elements(
              case
                when jsonb_typeof(checkin.workout_entries) = 'array' then checkin.workout_entries
                else '[]'::jsonb
              end
            ) as entry
            where entry ->> 'exerciseId' = quest.parameters ->> 'exerciseId'
              and exists (
                select 1
                from jsonb_array_elements(
                  case
                    when jsonb_typeof(entry -> 'sets') = 'array' then entry -> 'sets'
                    else '[]'::jsonb
                  end
                ) as workout_set
                where coalesce((workout_set ->> 'reps')::numeric, 0) > 0
                   or coalesce((workout_set ->> 'durationSec')::numeric, 0) > 0
              )
          )
          else false
        end
    )
  )
  where quest.user_id = new.user_id
    and quest.status = 'active';

  -- Completion is only possible while the quest is live. Once set, the
  -- status and award timestamp make subsequent reconciliations no-ops.
  update public.personal_quests as quest
  set status = 'completed',
      progress = quest.target,
      completed_at = now(),
      xp_awarded_at = now()
  where quest.user_id = new.user_id
    and quest.status = 'active'
    and current_date between quest.starts_on and quest.ends_on
    and quest.progress >= quest.target;

  update public.personal_quests as quest
  set status = 'expired'
  where quest.user_id = new.user_id
    and quest.status = 'active'
    and current_date > quest.ends_on;

  return new;
end;
$$;

revoke execute on function private.reconcile_personal_quests()
  from public, anon, authenticated, service_role;

create trigger trg_daily_checkins_reconcile_personal_quests
after insert or update on public.daily_checkins
for each row execute function private.reconcile_personal_quests();

create trigger trg_personal_quests_reconcile_on_insert
after insert on public.personal_quests
for each row execute function private.reconcile_personal_quests();

comment on function private.reconcile_personal_quests() is
  'Recalculates private quest progress and atomically records one-time completion XP after a check-in save.';
