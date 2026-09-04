'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateWeeklyReportPreference } from '@/app/actions/weekly-reports'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export function WeeklyReportSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, startTransition] = useTransition()

  function changePreference(nextEnabled: boolean) {
    setEnabled(nextEnabled)
    startTransition(async () => {
      const result = await updateWeeklyReportPreference(nextEnabled)
      if (result.error) {
        setEnabled(!nextEnabled)
        toast.error(result.error)
        return
      }
      toast.success(nextEnabled ? 'Weekly Hunter Reports enabled.' : 'Weekly Hunter Reports disabled.')
    })
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 shrink-0 nox-avatar-slot">
            <NoxPixelMascot state={pending ? 'loading' : 'idle'} label="Nox weekly report guide" className="h-auto w-full" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold tracking-wide">Weekly Hunter Report</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Receive one private, concise Nox analysis after an eligible week. Reports appear inside the application.
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-border/60 pt-4">
          <div>
            <p className="text-sm font-medium">Generate weekly reports</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Requires 3 check-in days, 2 workout days, and structured exercise details.
            </p>
          </div>
          <Switch
            checked={enabled}
            disabled={pending}
            onCheckedChange={changePreference}
            aria-label="Generate private weekly Hunter reports"
          />
        </div>

        <p className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-[0.7rem] leading-relaxed text-muted-foreground">
          When enabled, a minimized summary of your body profile, workouts, habits, and personal trends is sent to Groq for analysis. Names, email, user ID, invite data, and free-text notes are excluded. You can withdraw consent here at any time.
        </p>
      </CardContent>
    </Card>
  )
}
