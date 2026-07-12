-- Solo Leveling Challenge — consolidate situps into crunches; add squats
-- Run this in the Supabase SQL Editor after 0001–0004.
--
-- Situps and crunches are treated as the same movement for the group.
-- Existing situp counts are folded into crunches so the form still shows
-- the volume when someone opens an old day. score_xp on those rows is
-- left as-is until the day is re-saved (new formula applies on edit).

-- 1. Merge situps into crunches
update public.daily_checkins
set crunches = coalesce(crunches, 0) + coalesce(situps, 0)
where situps is not null and situps > 0;

-- 2. Drop situps
alter table public.daily_checkins drop column situps;

-- 3. Add squats (uncapped reps, scored like push-ups in app code)
alter table public.daily_checkins
  add column squats integer check (squats is null or squats >= 0);
