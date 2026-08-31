'use client'

import { Suspense, useActionState, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { requestPasswordReset } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { NoxBrandMark } from '@/components/NoxBrandMark'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { Mail } from 'lucide-react'

function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)
  const [email, setEmail] = useState('')
  const searchParams = useSearchParams()
  const invalidLink = searchParams.get('error') === 'invalid-link'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <NoxBrandMark />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Recover your account</CardTitle>
          <CardDescription>We’ll send a secure password-reset link to your email.</CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={pending || Boolean(state?.success)}
                  required
                />
              </div>
            </div>
            {invalidLink && (
              <p className="text-sm text-destructive" role="alert">
                That reset link is invalid or expired. Request a fresh one below.
              </p>
            )}
            {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
            {state?.success && (
              <p className="flex items-start gap-2 text-sm text-emerald-400" role="status">
                <NoxPixelMascot state="success" decorative className="-my-2 size-8 shrink-0" />
                {state.success}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending || Boolean(state?.success)}>
              {pending ? (
                <span className="flex items-center gap-2">
                  <NoxPixelMascot state="loading" decorative className="-my-2 size-8" />
                  Sending recovery link...
                </span>
              ) : state?.success ? (
                'Recovery email sent'
              ) : (
                'Send reset link'
              )}
            </Button>
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Back to login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
