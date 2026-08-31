import { OnboardingForm } from '@/components/OnboardingForm'
import { NoxBrandMark } from '@/components/NoxBrandMark'

export default function OnboardingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <NoxBrandMark />
      <OnboardingForm />
    </div>
  )
}
