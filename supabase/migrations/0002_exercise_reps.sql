-- Solo Leveling Challenge — exercise rep-count tracking
-- Run this in the Supabase SQL Editor after 0001_init.sql.
--
-- Restores per-exercise daily rep counts (the original ask: track pushups,
-- pullups, situps, crunches like the group's old Excel sheet), replacing the
-- flat "workout done" toggle with actual counts that feed the XP formula.

alter table public.daily_checkins
  add column pushups integer check (pushups is null or pushups >= 0),
  add column pullups integer check (pullups is null or pullups >= 0),
  add column situps integer check (situps is null or situps >= 0),
  add column crunches integer check (crunches is null or crunches >= 0);
