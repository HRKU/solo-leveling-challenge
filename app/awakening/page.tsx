'use client'

import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AwakeningPage() {
  const router = useRouter()

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => router.replace('/'), reducedMotion ? 350 : 1600)
    return () => window.clearTimeout(timer)
  }, [router])

  return (
    <div className="awakening-screen relative flex min-h-svh items-center justify-center overflow-hidden px-6">
      <div className="awakening-orbit" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="awakening-logo-shell">
          <NoxPixelMascot
            state="loading"
            label="Nox, your shadow hunter companion, loading your profile"
            className="awakening-logo size-44 sm:size-52"
          />
        </div>
        <p className="awakening-title mt-7 font-heading text-xl font-bold tracking-[0.22em] sm:text-2xl">
          SOLO LEVELING
        </p>
        <p className="awakening-subtitle mt-2 text-xs font-semibold tracking-[0.42em] text-primary uppercase">
          System online
        </p>
        <div className="awakening-progress mt-8 h-px w-52 overflow-hidden bg-primary/15">
          <div className="awakening-progress-bar h-full bg-primary" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Loading your Hunter profile...</p>
      </div>
    </div>
  )
}
