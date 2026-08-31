import { NoxPixelMascot } from '@/components/NoxPixelMascot'

export function NoxBrandMark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <NoxPixelMascot
        state="idle"
        label="Nox, Solo Leveling Challenge companion"
        className="nox-avatar-slot size-9 shrink-0"
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="nox-brand-shell nox-avatar-slot flex size-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25">
        <NoxPixelMascot
          state="idle"
          label="Nox, Solo Leveling Challenge companion"
          className="size-20"
        />
      </div>
      <div className="text-center">
        <p className="font-heading text-lg font-bold tracking-[0.15em] text-foreground">SOLO LEVELING</p>
        <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">Challenge</p>
      </div>
    </div>
  )
}
