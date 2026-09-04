import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/OnboardingForm'
import { NoxBrandMark } from '@/components/NoxBrandMark'
import { createClient, getCurrentOnboardedClaim, getCurrentUserId } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', userId)
    .single<{ onboarded: boolean }>()

  if (profile?.onboarded && await getCurrentOnboardedClaim() !== false) redirect('/')

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <NoxBrandMark />
      <OnboardingForm />
    </div>
  )
}
