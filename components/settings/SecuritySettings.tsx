'use client'

import { useActionState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { requestPasswordReset } from '@/app/actions/auth'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { SignOutDialog } from '@/components/SignOutDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function SecuritySettings({ email }: { email: string }) {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Account email</p>
            <p className="mt-0.5 break-all text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Send a secure reset link to the account email above.
              </p>
            </div>
          </div>
          <form action={action} className="shrink-0">
            <input type="hidden" name="email" value={email} />
            <Button type="submit" variant="outline" disabled={pending || Boolean(state?.success)} className="w-full sm:w-auto">
              {pending ? (
                <span className="flex items-center gap-2">
                  <NoxPixelMascot state="loading" decorative className="-my-2 size-8" />
                  Sending...
                </span>
              ) : state?.success ? (
                'Reset email sent'
              ) : (
                'Reset password'
              )}
            </Button>
          </form>
        </div>

        {state?.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-400" role="status">{state.success}</p> : null}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Current session</p>
            <p className="text-xs leading-relaxed text-muted-foreground">End the session on this device.</p>
          </div>
          <SignOutDialog />
        </div>
      </CardContent>
    </Card>
  )
}
