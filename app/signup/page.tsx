'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { NoxBrandMark } from '@/components/NoxBrandMark'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, undefined)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <NoxBrandMark />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Become a Hunter</CardTitle>
          <CardDescription>Create your account and start the climb.</CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                name="displayName"
                autoComplete="nickname"
                placeholder="Your name in the group"
                minLength={2}
                maxLength={40}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={pending}
                required
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={pending}
                required
                minLength={8}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inviteCode">Group invite code</Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                type="password"
                autoComplete="off"
                placeholder="Ask the group organizer"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                disabled={pending}
                required
              />
            </div>
            {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (
                <span className="flex items-center gap-2">
                  <NoxPixelMascot state="loading" decorative className="-my-2 size-8" />
                  Registering Hunter...
                </span>
              ) : (
                'Sign up'
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already a hunter?{' '}
              <Link href="/login" className="font-medium text-primary underline underline-offset-4">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
