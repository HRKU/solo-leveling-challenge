'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { NoxBrandMark } from '@/components/NoxBrandMark'
import { SignOutDialog } from '@/components/SignOutDialog'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CalendarDays, Trophy, TrendingUp, Sparkles, Settings } from 'lucide-react'

const LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/quests', label: 'Quests', icon: Sparkles },
]

const HIDDEN_ROUTES = [
  '/login',
  '/signup',
  '/onboarding',
  '/forgot-password',
  '/update-password',
  '/awakening',
]

function NavigationPendingIndicator() {
  const { pending } = useLinkStatus()
  if (!pending) return null

  return (
    <span
      aria-hidden
      className="fixed inset-x-0 top-0 z-60 h-0.5 bg-primary shadow-[0_0_12px_var(--primary)] motion-safe:animate-pulse"
    />
  )
}

export function NavBar() {
  const pathname = usePathname()

  if (HIDDEN_ROUTES.some((route) => pathname.startsWith(route))) {
    return null
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="relative flex shrink-0 items-center gap-2">
            <NoxBrandMark compact />
            <span className="font-heading text-sm font-semibold tracking-wide whitespace-nowrap text-foreground">
              SOLO LEVELING
            </span>
            <NavigationPendingIndicator />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => {
              const Icon = link.icon
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground',
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={2} />
                  {link.label}
                  <NavigationPendingIndicator />
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              aria-label="Settings"
              className={cn(
                'relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                pathname === '/settings' && 'bg-muted text-foreground'
              )}
            >
              <Settings className="size-4" strokeWidth={2} />
              <NavigationPendingIndicator />
            </Link>
            <SignOutDialog compact />
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-1">
          {LINKS.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[0.7rem] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                {link.label}
                <NavigationPendingIndicator />
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
