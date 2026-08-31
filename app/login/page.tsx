'use client'

import { Suspense, useActionState, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { NoxBrandMark } from '@/components/NoxBrandMark'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'

function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const searchParams = useSearchParams()
  const passwordReset = searchParams.get('reset') === 'success'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <NoxBrandMark />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Welcome back, Hunter</CardTitle>
          <CardDescription>Log in to continue your climb.</CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={pending}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={pending}
                required
              />
            </div>
            {passwordReset && (
              <p className="flex items-center gap-2 text-sm text-emerald-400" role="status">
                <NoxPixelMascot state="success" decorative className="-my-2 size-8 shrink-0" />
                Password updated. Log in with your new password.
              </p>
            )}
            {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (
                <span className="flex items-center gap-2">
                  <NoxPixelMascot state="loading" decorative className="-my-2 size-8" />
                  Entering the gate...
                </span>
              ) : (
                'Log in'
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              New here?{' '}
              <Link href="/signup" className="font-medium text-primary underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <LoginForm />
    </Suspense>
  )
}
