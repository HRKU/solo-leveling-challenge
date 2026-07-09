import { OnboardingForm } from '@/components/OnboardingForm'
import { Swords } from 'lucide-react'

export default function OnboardingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
          <Swords className="size-7 text-primary" strokeWidth={2} />
        </div>
        <div className="text-center">
          <p className="font-heading text-lg font-bold tracking-[0.15em] text-foreground">SOLO LEVELING</p>
          <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">Challenge</p>
        </div>
      </div>
      <OnboardingForm />
    </div>
  )
}
