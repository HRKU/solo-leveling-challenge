-- Solo Leveling Challenge — reset all data before sharing with the group
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run; it's a no-op on an already-empty project.
--
-- Deleting from auth.users cascades through profiles, daily_checkins, and
-- weekly_checkins automatically (all three reference auth.users.id with
-- ON DELETE CASCADE, per supabase/migrations/0001_init.sql), so removing
-- every auth user clears the whole app back to a blank slate in one step.

-- 1. See what's about to be deleted (run this first as a sanity check).
select id, email, created_at from auth.users order by created_at;

-- 2. Wipe every account and everything tied to it.
delete from auth.users;

-- 3. Confirm it's empty.
select count(*) as remaining_users from auth.users;
select count(*) as remaining_profiles from public.profiles;
select count(*) as remaining_daily_checkins from public.daily_checkins;
select count(*) as remaining_weekly_checkins from public.weekly_checkins;
