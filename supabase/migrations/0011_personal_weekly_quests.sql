-- Private, server-managed weekly quests generated from eligible AI reports.

-- Support a composite foreign key so a quest cannot reference another user's
-- report, even through a trusted server-side code path.
alter table public.ai_weekly_reports
  add constraint ai_weekly_reports_id_user_unique unique (id, user_id);

create table public.personal_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_report_id uuid not null,
  quest_type text not null check (
    quest_type in (
      'checkin_days',
      'workout_days',
      'habit_target_days',
      'exercise_sessions'
    )
  ),
  parameters jsonb not null default '{}'::jsonb
    check (jsonb_typeof(parameters) = 'object'),
  title text not null check (length(btrim(title)) between 1 and 120),
  description text not null check (length(btrim(description)) between 1 and 500),
  target integer not null check (target between 1 and 7),
  progress integer not null default 0 check (progress between 0 and target),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'expired')),
  xp_reward integer not null check (xp_reward > 0),
  completed_at timestamptz,
  xp_awarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_quests_source_report_owner_fk
    foreign key (source_report_id, user_id)
    references public.ai_weekly_reports (id, user_id)
    on delete cascade,
  constraint personal_quests_week_check check (
    extract(isodow from starts_on) = 1
    and ends_on = starts_on + 6
  ),
  constraint personal_quests_completion_check check (
    (status = 'completed'
      and progress = target
      and completed_at is not null
      and xp_awarded_at is not null)
    or
    (status in ('active', 'expired')
      and completed_at is null
      and xp_awarded_at is null)
  ),
  constraint personal_quests_report_type_unique
    unique (user_id, source_report_id, quest_type)
);

create index personal_quests_user_status_dates_idx
  on public.personal_quests (user_id, status, starts_on desc, ends_on desc);

create index personal_quests_active_end_idx
  on public.personal_quests (ends_on)
  where status = 'active';

create trigger trg_personal_quests_updated_at
before update on public.personal_quests
for each row execute function public.set_updated_at();

alter table public.personal_quests enable row level security;

-- Personal quests are visible only to their owner. Creation, progress,
-- completion, expiry, and XP awards are all handled by trusted server paths.
revoke all on table public.personal_quests from anon, authenticated;
grant select on table public.personal_quests to authenticated;
grant all on table public.personal_quests to service_role;

create policy "personal_quests_select_own"
on public.personal_quests for select
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.personal_quests is
  'Private weekly quests derived from AI reports; all writes are server-managed.';
comment on column public.personal_quests.parameters is
  'Deterministic completion parameters, such as a habit field or exercise id.';
comment on column public.personal_quests.xp_awarded_at is
  'Set atomically with completion to make the XP award auditable and one-time.';
