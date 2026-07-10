import { createClient, getCurrentUserId } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/ProfileEditForm'
import { ReminderSettings } from '@/components/ReminderSettings'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId!)
    .single<Profile>()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-4 pb-8">
      <ProfileEditForm profile={profile!} />
      <ReminderSettings />
    </div>
  )
}
