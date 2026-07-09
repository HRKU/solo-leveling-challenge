'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Swords } from 'lucide-react'

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
          <Swords className="size-7 text-primary" strokeWidth={2} />
        </div>
        <div className="text-center">
          <p className="font-heading text-lg font-bold tracking-[0.15em] text-foreground">SOLO LEVELING</p>
          <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">Challenge</p>
        </div>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Welcome back, Hunter</CardTitle>
          <CardDescription>Log in to continue your climb.</CardDescription>
        </CardHeader>
        <form action={action}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Logging in...' : 'Log in'}
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
