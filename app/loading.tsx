import { NoxStatusCard } from '@/components/NoxStatusCard'

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center p-4">
      <NoxStatusCard
        state="loading"
        eyebrow="SYSTEM // SYNCHRONIZING"
        title="Nox is scouting ahead"
        description="Gathering your latest quests, progress, and Hunter status."
        className="w-full"
      />
    </div>
  )
}
