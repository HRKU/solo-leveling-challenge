import { redirect } from 'next/navigation'
import { getCurrentOnboardedClaim, getCurrentUserId } from '@/lib/supabase/server'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  if (await getCurrentOnboardedClaim() === false) redirect('/onboarding')

  return children
}
