import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/ProfileEditForm'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single<Profile>()

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-4">
      <ProfileEditForm profile={profile!} />
    </div>
  )
}
