'use client'

import { Monitor, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const THEMES = [
  { value: 'dark', label: 'Dark', description: 'Always use the Hunter dark theme', icon: Moon },
  { value: 'system', label: 'System', description: 'Follow this device’s appearance', icon: Monitor },
] as const

export function AppearancePreferences() {
  const { theme, setTheme } = useTheme()
  const selectedTheme = theme ?? 'dark'

  return (
    <Card>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {THEMES.map((option) => {
            const Icon = option.icon
            const selected = selectedTheme === option.value
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                className={cn(
                  'h-auto min-h-20 items-start justify-start gap-3 px-4 py-3 text-left',
                  selected && 'border-primary/60 bg-primary/10 ring-2 ring-primary/20'
                )}
                onClick={() => setTheme(option.value)}
                aria-pressed={selected}
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-xs font-normal whitespace-normal text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
