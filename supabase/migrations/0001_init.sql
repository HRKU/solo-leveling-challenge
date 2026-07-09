-- Solo Leveling Challenge — initial schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run).

-- =========================================================================
-- 1. profiles
-- =========================================================================
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text not null,
  name                text,
  age                 integer check (age is null or (age > 0 and age < 130)),
  sex                 text check (sex in ('male', 'female', 'other')),
  height_cm           numeric check (height_cm is null or height_cm > 0),
  starting_weight_kg  numeric check (starting_weight_kg is null or starting_weight_kg > 0),
  current_weight_kg   numeric check (current_weight_kg is null or current_weight_kg > 0),
  goal_type           text check (goal_type in ('lose', 'gain', 'maintain')),
  target_weight_kg    numeric check (target_weight_kg is null or target_weight_kg > 0),
  total_xp            integer not null default 0 check (total_xp >= 0),
  level               integer not null default 1 check (level >= 1),
  rank                text not null default 'E' check (rank in ('E', 'D', 'C', 'B', 'A', 'S')),
  current_streak      integer not null default 0 check (current_streak >= 0),
  last_log_date       date,
  onboarded           boolean not null default false,
  created_at          timestamptz not null default now()
);

comment on table public.profiles is 'One row per Supabase auth user. Body-metric fields are nullable until onboarding completes; XP/level/rank are server-derived.';

-- =========================================================================
-- 2. daily_checkins
-- =========================================================================
create table public.daily_checkins (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  checkin_date     date not null,
  workout_done     boolean not null default false,
  workout_type     text,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  calories         integer check (calories is null or calories >= 0),
  protein_g        numeric check (protein_g is null or protein_g >= 0),
  water_ml         integer check (water_ml is null or water_ml >= 0),
  sleep_hours      numeric check (sleep_hours is null or (sleep_hours >= 0 and sleep_hours <= 24)),
  steps            integer check (steps is null or steps >= 0),
  notes            text,
  score_xp         integer not null default 0 check (score_xp >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create index idx_daily_checkins_user_date on public.daily_checkins (user_id, checkin_date desc);
create index idx_daily_checkins_date on public.daily_checkins (checkin_date);

-- =========================================================================
-- 3. weekly_checkins
-- =========================================================================
create table public.weekly_checkins (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  weight_kg       numeric not null check (weight_kg > 0),
  body_fat_pct    numeric check (body_fat_pct is null or (body_fat_pct >= 0 and body_fat_pct <= 100)),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create index idx_weekly_checkins_user_week on public.weekly_checkins (user_id, week_start_date desc);

-- =========================================================================
-- 4. updated_at trigger helper (shared by daily_checkins + weekly_checkins)
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_daily_checkins_updated_at
before update on public.daily_checkins
for each row execute function public.set_updated_at();

create trigger trg_weekly_checkins_updated_at
before update on public.weekly_checkins
for each row execute function public.set_updated_at();

-- =========================================================================
-- 5. Row Level Security
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.weekly_checkins enable row level security;

-- profiles: whole group can read (leaderboard); only owner can update.
-- No insert policy — rows are created exclusively by handle_new_user (security definer).
create policy "profiles_select_all"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- daily_checkins: whole group can read; only owner can insert/update own rows.
create policy "daily_checkins_select_all"
on public.daily_checkins for select
to authenticated
using (true);

create policy "daily_checkins_insert_own"
on public.daily_checkins for insert
to authenticated
with check (auth.uid() = user_id);

create policy "daily_checkins_update_own"
on public.daily_checkins for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- weekly_checkins: same ownership shape as daily_checkins.
create policy "weekly_checkins_select_all"
on public.weekly_checkins for select
to authenticated
using (true);

create policy "weekly_checkins_insert_own"
on public.weekly_checkins for insert
to authenticated
with check (auth.uid() = user_id);

create policy "weekly_checkins_update_own"
on public.weekly_checkins for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================================================================
-- 6. Auto-provisioning: create a profiles row when a new auth user signs up
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, display_name,
    name, age, sex, height_cm, starting_weight_kg, current_weight_kg, goal_type, target_weight_kg,
    total_xp, level, rank, current_streak, last_log_date, onboarded
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    null, null, null, null, null, null, null, null,
    0, 1, 'E', 0, null, false
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
