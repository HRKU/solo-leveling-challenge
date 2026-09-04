-- Opt-in AI weekly reports. Both tables contain private user data.

create table public.ai_report_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_enabled boolean not null default false,
  consented_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint ai_report_preferences_consent_check
    check (not weekly_enabled or consented_at is not null)
);

create trigger trg_ai_report_preferences_updated_at
before update on public.ai_report_preferences
for each row execute function public.set_updated_at();

create table public.ai_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'failed')),
  report jsonb,
  source_payload jsonb,
  model text,
  prompt_version text not null default 'weekly-v3',
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  failure_code text,
  generation_started_at timestamptz not null default now(),
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date),
  constraint ai_weekly_reports_ready_check check (
    status <> 'ready' or (report is not null and generated_at is not null)
  )
);

create index ai_weekly_reports_user_week_idx
  on public.ai_weekly_reports (user_id, week_start_date desc);

create trigger trg_ai_weekly_reports_updated_at
before update on public.ai_weekly_reports
for each row execute function public.set_updated_at();

alter table public.ai_report_preferences enable row level security;
alter table public.ai_weekly_reports enable row level security;

revoke all on table public.ai_report_preferences from anon, authenticated;
revoke all on table public.ai_weekly_reports from anon, authenticated;

grant select, insert, update on table public.ai_report_preferences to authenticated;
grant select on table public.ai_weekly_reports to authenticated;
grant all on table public.ai_report_preferences to service_role;
grant all on table public.ai_weekly_reports to service_role;

create policy "ai_report_preferences_select_own"
on public.ai_report_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "ai_report_preferences_insert_own"
on public.ai_report_preferences for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "ai_report_preferences_update_own"
on public.ai_report_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "ai_weekly_reports_select_own"
on public.ai_weekly_reports for select
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.ai_report_preferences is
  'Private opt-in and consent record for AI-generated weekly reports.';
comment on table public.ai_weekly_reports is
  'Private weekly AI reports and minimized source summaries; writes are server-only.';
