'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/checkin/weekly', label: 'Weekly check-in' },
  { href: '/progress', label: 'Progress' },
]

const HIDDEN_ROUTES = ['/login', '/signup', '/onboarding']

export function NavBar() {
  const pathname = usePathname()

  if (HIDDEN_ROUTES.some((route) => pathname.startsWith(route))) {
    return null
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <nav className="mx-auto flex max-w-2xl items-center justify-between gap-2 overflow-x-auto p-3">
        <div className="flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted',
                pathname === link.href ? 'bg-muted text-foreground' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </nav>
    </header>
  )
}
