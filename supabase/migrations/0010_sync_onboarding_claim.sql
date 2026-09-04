-- Keep the server-controlled onboarding gate in the signed auth claims so the
-- navigation proxy does not need a profiles query on every protected route.
update auth.users as users
set raw_app_meta_data = coalesce(users.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('onboarded', profiles.onboarded)
from public.profiles as profiles
where profiles.id = users.id
  and users.raw_app_meta_data -> 'onboarded' is distinct from to_jsonb(profiles.onboarded);
