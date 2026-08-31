'use client'

import { useEffect } from 'react'
import { NoxStatusCard } from '@/components/NoxStatusCard'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center p-4">
      <NoxStatusCard
        state="error"
        eyebrow="SYSTEM // INTERRUPTED"
        title="Nox lost the trail"
        description="Something interrupted this mission. Your saved progress is safe; retry the current screen."
        className="w-full"
      >
        <Button type="button" onClick={unstable_retry}>
          Try again
        </Button>
      </NoxStatusCard>
    </div>
  )
}
