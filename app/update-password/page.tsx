'use client'

import { useActionState, useState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { NoxBrandMark } from '@/components/NoxBrandMark'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { KeyRound } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <NoxBrandMark />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Choose a new password</CardTitle>
          <CardDescription>Use at least 8 characters for your new Hunter credential.</CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className="pl-9"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={pending}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={pending}
                required
              />
            </div>
            {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <span className="flex items-center gap-2">
                  <NoxPixelMascot state="loading" decorative className="-my-2 size-8" />
                  Updating credential...
                </span>
              ) : (
                'Update password'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
