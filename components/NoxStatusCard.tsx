import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { cn } from '@/lib/utils'

type NoxStatusCardProps = {
  state?: 'idle' | 'loading' | 'success' | 'error'
  eyebrow?: string
  title: string
  description: string
  className?: string
  compact?: boolean
  children?: React.ReactNode
}

export function NoxStatusCard({
  state = 'idle',
  eyebrow = 'NOX // COMPANION',
  title,
  description,
  className,
  compact = false,
  children,
}: NoxStatusCardProps) {
  return (
    <section
      className={cn(
        'nox-status-card relative overflow-hidden rounded-2xl border border-primary/20 bg-card/80',
        compact ? 'px-4 py-3' : 'px-4 py-4 sm:px-5',
        className
      )}
      aria-live={state === 'loading' ? 'polite' : undefined}
      aria-busy={state === 'loading' || undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_50%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_38%)]" />
      <div className="relative flex items-center gap-3.5">
        <div className={cn('nox-avatar-slot shrink-0', compact ? 'w-14' : 'w-20 sm:w-24')}>
          <NoxPixelMascot
            state={state}
            label={`Nox companion: ${title}`}
            className="h-auto w-full"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[0.6rem] font-semibold tracking-[0.2em] text-primary/80 uppercase">
            {eyebrow}
          </p>
          <h2 className={cn('mt-1 font-heading font-semibold tracking-wide', compact ? 'text-sm' : 'text-base')}>
            {title}
          </h2>
          <p className={cn('mt-1 leading-relaxed text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {description}
          </p>
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
    </section>
  )
}
