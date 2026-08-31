import { redirect } from 'next/navigation'
import { Bell, Bot, Info, Palette, ShieldCheck, UserRound } from 'lucide-react'
import { AppearancePreferences } from '@/components/settings/AppearancePreferences'
import { NoxPreferences } from '@/components/settings/NoxPreferences'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { ProfileEditForm } from '@/components/ProfileEditForm'
import { ReminderSettings } from '@/components/ReminderSettings'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient, getCurrentUserId } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

const SETTINGS_LINKS = [
  { href: '#profile', label: 'Hunter profile', icon: UserRound },
  { href: '#companion', label: 'Nox companion', icon: Bot },
  { href: '#appearance', label: 'Appearance', icon: Palette },
  { href: '#notifications', label: 'Notifications', icon: Bell },
  { href: '#security', label: 'Account & security', icon: ShieldCheck },
  { href: '#application', label: 'Application', icon: Info },
]

function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-3">
        <h2 className="font-heading text-base font-semibold tracking-wide sm:text-lg">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const [{ data: profile }, { data: authData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId!).single<Profile>(),
    supabase.auth.getUser(),
  ])

  if (!profile || !authData.user?.email) {
    redirect('/login')
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 pb-10 sm:p-6">
      <div className="mb-6">
        <p className="font-heading text-[0.65rem] font-semibold tracking-[0.22em] text-primary uppercase">
          System configuration
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Manage your Hunter profile, companion behavior, device preferences, reminders, and account security.
        </p>
      </div>

      <div className="grid gap-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
        <aside className="min-w-0 lg:sticky lg:top-20">
          <nav
            aria-label="Settings sections"
            className="settings-section-nav -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
          >
            {SETTINGS_LINKS.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex shrink-0 items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted hover:text-foreground lg:w-full lg:border-transparent lg:bg-transparent lg:text-sm"
                >
                  <Icon className="size-4 shrink-0 text-primary" strokeWidth={2} />
                  {item.label}
                </a>
              )
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col gap-9">
          <SettingsSection
            id="profile"
            title="Hunter profile"
            description="Personal details used to calculate your daily targets. Current weight is updated from Progress."
          >
            <ProfileEditForm profile={profile} />
          </SettingsSection>

          <SettingsSection
            id="companion"
            title="Nox companion"
            description="Choose how visible and active your pixel companion should be on this device."
          >
            <NoxPreferences />
          </SettingsSection>

          <SettingsSection
            id="appearance"
            title="Appearance"
            description="Use the permanent dark interface or follow this device’s system appearance."
          >
            <AppearancePreferences />
          </SettingsSection>

          <SettingsSection
            id="notifications"
            title="Notifications"
            description="Control reminder permissions for this browser or installed application."
          >
            <ReminderSettings />
          </SettingsSection>

          <SettingsSection
            id="security"
            title="Account and security"
            description="Review the current account, recover your password, or end this device session."
          >
            <SecuritySettings email={authData.user.email} />
          </SettingsSection>

          <SettingsSection
            id="application"
            title="Application"
            description="Information about this installation of Solo Leveling Challenge."
          >
            <Card>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold tracking-wide">Solo Leveling Challenge</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Installable progressive web application for tracking daily missions and group progress.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Badge variant="secondary">v0.1.0</Badge>
                  <Badge variant="outline">PWA ready</Badge>
                </div>
              </CardContent>
            </Card>
          </SettingsSection>
        </div>
      </div>
    </div>
  )
}
