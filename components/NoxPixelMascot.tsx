import { cn } from '@/lib/utils'

type NoxPixelState = 'idle' | 'loading' | 'success' | 'error'

type NoxPixelMascotProps = {
  state?: NoxPixelState
  className?: string
  label?: string
  decorative?: boolean
}

function Rune({ state }: { state: NoxPixelState }) {
  if (state === 'success') {
    return (
      <g className="nox-pixel-state-mark nox-pixel-success" aria-hidden="true">
        <rect x="112" y="150" width="8" height="8" fill="#dcfce7" />
        <rect x="120" y="158" width="8" height="8" fill="#dcfce7" />
        <rect x="128" y="150" width="8" height="8" fill="#dcfce7" />
        <rect x="136" y="142" width="8" height="8" fill="#dcfce7" />
      </g>
    )
  }

  if (state === 'error') {
    return (
      <g className="nox-pixel-state-mark nox-pixel-error" aria-hidden="true">
        <path d="M112 142h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="#fee2e2" />
        <path d="M136 142h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="#fee2e2" />
      </g>
    )
  }

  if (state === 'loading') {
    return (
      <g className="nox-pixel-loading-rune" aria-hidden="true">
        <path
          d="M112 136h32v8h8v8h8v16h-8v8h-8v8h-32v-8h-8v-8h-8v-16h8v-8h8zm8 8v8h-8v16h8v8h16v-8h8v-16h-8v-8z"
          fill="#7c3aed"
        />
        <rect x="120" y="136" width="16" height="4" fill="#c4b5fd" />
        <rect x="156" y="156" width="4" height="8" fill="#c4b5fd" />
        <rect x="120" y="180" width="16" height="4" fill="#4c1d95" />
        <rect x="100" y="156" width="4" height="8" fill="#4c1d95" />
      </g>
    )
  }

  return (
    <g className="nox-pixel-core" aria-hidden="true">
      <path d="M128 140l16 16-16 20-16-20z" fill="#6d28d9" />
      <path d="M128 148l8 8-8 12-8-12z" fill="#ddd6fe" />
      <rect x="124" y="152" width="8" height="8" fill="#f5f3ff" />
    </g>
  )
}

export function NoxPixelMascot({
  state = 'idle',
  className,
  label = `Nox shadow hunter mascot, ${state}`,
  decorative = false,
}: NoxPixelMascotProps) {
  const isAlert = state === 'error'

  return (
    <svg
      viewBox="0 0 256 256"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      className={cn('nox-pixel-mascot', `nox-pixel-state-${state}`, className)}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <g className="nox-pixel-shadow" aria-hidden="true">
        <rect x="64" y="224" width="128" height="8" fill="#312e81" opacity="0.24" />
        <rect x="80" y="232" width="96" height="8" fill="#312e81" opacity="0.12" />
      </g>

      <g className="nox-pixel-float">
        <g className="nox-pixel-swords" aria-hidden="true">
          <g>
            <path d="M40 32h16v8h8v8h8v8h8v8h8v8h8v8h8v8h8v16h-16v-8h-8v-8h-8v-8h-8v-8h-8v-8h-8v-8h-8V48h-8z" fill="#1e1b4b" />
            <path d="M48 40h8v8h8v8h8v8h8v8h8v8h8v8h8v8h-8v-8h-8v-8h-8v-8h-8v-8h-8v-8h-8v-8h-8z" fill="#818cf8" />
            <rect x="32" y="24" width="24" height="8" fill="#11102d" />
            <rect x="40" y="16" width="8" height="24" fill="#4f46e5" />
            <rect x="32" y="16" width="8" height="8" fill="#a5b4fc" />
            <rect x="48" y="24" width="8" height="8" fill="#a5b4fc" />
          </g>
          <g transform="translate(256 0) scale(-1 1)">
            <path d="M40 32h16v8h8v8h8v8h8v8h8v8h8v8h8v8h8v16h-16v-8h-8v-8h-8v-8h-8v-8h-8v-8h-8v-8h-8V48h-8z" fill="#1e1b4b" />
            <path d="M48 40h8v8h8v8h8v8h8v8h8v8h8v8h8v8h-8v-8h-8v-8h-8v-8h-8v-8h-8v-8h-8v-8h-8z" fill="#818cf8" />
            <rect x="32" y="24" width="24" height="8" fill="#11102d" />
            <rect x="40" y="16" width="8" height="24" fill="#4f46e5" />
            <rect x="32" y="16" width="8" height="8" fill="#a5b4fc" />
            <rect x="48" y="24" width="8" height="8" fill="#a5b4fc" />
          </g>
        </g>

        <g className="nox-pixel-tail" aria-hidden="true">
          <path d="M104 184h48v8h16v16h-8v8h-16v8h8v8h-8v8h-16v-8h-8v-8h8v-8h-24v-8H88v-16h16z" fill="#312e81" />
          <path d="M112 192h32v8h8v8h-16v8h-16v-8h-16v-8h8z" fill="#6d28d9" />
          <rect x="128" y="224" width="16" height="8" fill="#4f46e5" />
        </g>

        <g className="nox-pixel-cloak" aria-hidden="true">
          <path d="M64 120h32v8h64v-8h32v16h16v40h-8v16h-16v8h-16v-16h-16v16h-48v-16H88v16H72v-8H56v-16h-8v-40h16z" fill="#17152f" />
          <path d="M56 136h32v16H72v24H56z" fill="#312e81" />
          <path d="M168 136h32v40h-16v-24h-16z" fill="#312e81" />
          <rect x="64" y="136" width="8" height="24" fill="#4f46e5" />
          <rect x="184" y="136" width="8" height="24" fill="#4f46e5" />
          <rect x="88" y="184" width="16" height="8" fill="#4f46e5" />
          <rect x="152" y="184" width="16" height="8" fill="#4f46e5" />
        </g>

        <g className="nox-pixel-body" aria-hidden="true">
          <path d="M96 112h64v16h8v56h-16v16h-48v-16H88v-56h8z" fill="#23203f" />
          <path d="M112 120h32v8h8v56h-16v8h-16v-8h-16v-56h8z" fill="#312e81" />
          <rect x="104" y="128" width="8" height="48" fill="#4338ca" />
          <rect x="144" y="128" width="8" height="48" fill="#1e1b4b" />
          <path d="M80 120h32v16H96v16H72v-8H64v-16h16z" fill="#272342" />
          <path d="M176 120h16v8h8v16h-8v8h-32v-16h-16v-16z" fill="#272342" />
          <rect x="72" y="136" width="24" height="16" fill="#111020" />
          <rect x="160" y="136" width="24" height="16" fill="#111020" />
          <rect x="80" y="136" width="8" height="8" fill="#6366f1" />
          <rect x="168" y="136" width="8" height="8" fill="#6366f1" />
        </g>

        <g className="nox-pixel-hood" aria-hidden="true">
          <path d="M104 24h48v8h16v16h16v64h-16v16H88v-16H72V56h16V40h16z" fill="#131225" />
          <path d="M112 32h32v8h16v16h8v16H88V56h8V40h16z" fill="#312e81" />
          <path d="M96 56h64v8h8v40h-8v16H96v-16h-8V72h8z" fill="#080812" />
          <rect x="88" y="64" width="8" height="40" fill="#4f46e5" />
          <rect x="160" y="64" width="8" height="40" fill="#312e81" />
          <rect x="96" y="56" width="40" height="8" fill="#4338ca" />
          <path d="M128 32l16 16-16 20-16-20z" fill="#4338ca" />
          <path d="M128 40l8 8-8 12-8-12z" fill="#a5b4fc" />
          <g className="nox-pixel-eyes">
            <path d="M104 80h24v8h-8v8h-16z" fill={isAlert ? '#fca5a5' : '#a5b4fc'} />
            <path d="M128 80h24v16h-16v-8h-8z" fill={isAlert ? '#fca5a5' : '#a5b4fc'} />
            <rect x="112" y="80" width="8" height="8" fill={isAlert ? '#fff1f2' : '#f5f3ff'} />
            <rect x="136" y="80" width="8" height="8" fill={isAlert ? '#fff1f2' : '#f5f3ff'} />
          </g>
          <rect x="96" y="112" width="64" height="8" fill="#272342" />
          <rect x="112" y="112" width="32" height="8" fill="#4f46e5" />
        </g>

        <Rune state={state} />

        {state === 'loading' ? (
          <g className="nox-pixel-particles" aria-hidden="true">
            <rect className="nox-pixel-particle nox-pixel-particle-one" x="88" y="152" width="8" height="8" fill="#a5b4fc" />
            <rect className="nox-pixel-particle nox-pixel-particle-two" x="168" y="144" width="8" height="8" fill="#818cf8" />
            <rect className="nox-pixel-particle nox-pixel-particle-three" x="152" y="192" width="8" height="8" fill="#4f46e5" />
          </g>
        ) : null}
      </g>
    </svg>
  )
}
