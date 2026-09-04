import { NoxStatusCard } from '@/components/NoxStatusCard'

export function PageLoadingState({ title = 'Nox is scouting ahead' }: { title?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <NoxStatusCard
        state="loading"
        eyebrow="SYSTEM // SYNCHRONIZING"
        title={title}
        description="Gathering the latest Hunter data."
      />
      <div className="grid gap-3" aria-hidden>
        <div className="h-24 animate-pulse rounded-2xl bg-muted/55" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
        <div className="h-20 animate-pulse rounded-2xl bg-muted/30" />
      </div>
    </div>
  )
}
