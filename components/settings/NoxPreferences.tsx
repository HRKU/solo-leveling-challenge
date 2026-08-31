'use client'

import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { setNoxPreferences, useNoxPreferences, type NoxMotion } from '@/lib/nox-preferences'

const MOTION_OPTIONS: Array<{ value: NoxMotion; label: string; description: string }> = [
  { value: 'full', label: 'Full', description: 'Pixel animation and effects' },
  { value: 'reduced', label: 'Reduced', description: 'Slower, quieter movement' },
  { value: 'off', label: 'Off', description: 'Static companion artwork' },
]

export function NoxPreferences() {
  const preferences = useNoxPreferences()

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="w-20 shrink-0 nox-avatar-slot">
            <NoxPixelMascot state="idle" label="Nox preference preview" className="h-auto w-full" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold tracking-wide">Your shadow companion</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              These preferences stay on this device and apply throughout the application.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <div>
            <p className="text-sm font-medium">Show Nox</p>
            <p className="text-xs text-muted-foreground">Display the mascot in branding and status messages.</p>
          </div>
          <Switch
            checked={preferences.visible}
            onCheckedChange={(visible) => setNoxPreferences({ ...preferences, visible })}
            aria-label="Show Nox throughout the application"
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <div>
            <p className="text-sm font-medium">Contextual tips</p>
            <p className="text-xs text-muted-foreground">Let Nox surface reminders such as the daily streak directive.</p>
          </div>
          <Switch
            checked={preferences.tips}
            onCheckedChange={(tips) => setNoxPreferences({ ...preferences, tips })}
            aria-label="Show contextual tips from Nox"
          />
        </div>

        <fieldset className="border-t border-border/60 pt-4">
          <legend className="text-sm font-medium">Animation</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            Your operating system’s reduced-motion setting always takes priority.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {MOTION_OPTIONS.map((option) => {
              const selected = preferences.motion === option.value
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  className={cn('h-auto min-h-16 flex-col items-start gap-0.5 px-3 py-2 text-left', selected && 'ring-2 ring-primary/25')}
                  onClick={() => setNoxPreferences({ ...preferences, motion: option.value })}
                  aria-pressed={selected}
                >
                  <span>{option.label}</span>
                  <span className={cn('text-[0.68rem] font-normal', selected ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
                    {option.description}
                  </span>
                </Button>
              )
            })}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  )
}
