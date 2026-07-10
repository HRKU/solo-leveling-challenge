-- Push notification subscriptions: one row per device/browser a user has
-- enabled reminders on. Read by the cron sender (service role, bypasses RLS);
-- written only by the owning user.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Owner-only on every verb: unlike the group-visible tables, there is no
-- reason for members to see each other's device subscriptions.
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated
  using (auth.uid() = user_id);
