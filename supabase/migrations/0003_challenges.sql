-- Solo Leveling Challenge — Quests (group dare system)
-- Run this in the Supabase SQL Editor after 0001_init.sql and 0002_exercise_reps.sql.
--
-- A challenge is free-text, creator-set, fixed-XP-reward, scoped to the
-- calendar month it was created in. Completion is a per-member self-reported
-- boolean, visible to the whole group. v1 is insert-only: no edit/delete for
-- challenges once posted (editing/deleting after members have already
-- completed one creates fairness problems with no clean resolution rule).

-- =========================================================================
-- 1. challenges
-- =========================================================================
create table public.challenges (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null references auth.users(id) on delete cascade,
  title        text not null check (char_length(trim(title)) > 0),
  description  text,
  xp_reward    integer not null check (xp_reward > 0 and xp_reward <= 1000),
  start_date   date not null,
  end_date     date not null check (end_date >= start_date),
  created_at   timestamptz not null default now()
);

comment on table public.challenges is
  'Free-text group dares. Immutable once created (v1: no update/delete policy). Duration is always locked to the calendar month of creation.';

create index idx_challenges_start_date on public.challenges (start_date desc);

-- =========================================================================
-- 2. challenge_completions
-- =========================================================================
create table public.challenge_completions (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create index idx_challenge_completions_user on public.challenge_completions (user_id);
create index idx_challenge_completions_challenge on public.challenge_completions (challenge_id);

create trigger trg_challenge_completions_updated_at
before update on public.challenge_completions
for each row execute function public.set_updated_at();
-- Reuses public.set_updated_at() defined in 0001_init.sql — no redefinition needed.

-- =========================================================================
-- 3. Row Level Security
-- =========================================================================
alter table public.challenges enable row level security;
alter table public.challenge_completions enable row level security;

-- challenges: whole group can read (group-wide visibility, matches
-- daily_checkins/weekly_checkins); any authenticated member can create one
-- as long as they name themselves as creator. No update/delete policy at all
-- for v1 — immutable once posted.
create policy "challenges_select_all"
on public.challenges for select
to authenticated
using (true);

create policy "challenges_insert_own"
on public.challenges for insert
to authenticated
with check (auth.uid() = creator_id);

-- challenge_completions: whole group can read (this is the point — seeing
-- who's done the dare); only the owner can insert/update their own row.
create policy "challenge_completions_select_all"
on public.challenge_completions for select
to authenticated
using (true);

create policy "challenge_completions_insert_own"
on public.challenge_completions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "challenge_completions_update_own"
on public.challenge_completions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
