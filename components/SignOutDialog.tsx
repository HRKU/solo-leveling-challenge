'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { NoxPixelMascot } from '@/components/NoxPixelMascot'
import { Button } from '@/components/ui/button'

export function SignOutDialog({ compact = false }: { compact?: boolean }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger
        render={
          compact ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Sign out"
              className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            />
          ) : (
            <Button type="button" variant="outline" className="text-destructive hover:text-destructive" />
          )
        }
      >
        <LogOut className="size-4" strokeWidth={2} />
        {!compact ? 'Sign out' : null}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm transition-opacity duration-150 data-open:opacity-100 data-closed:opacity-0" />
        <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialog.Popup className="w-full max-w-sm rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl outline-none transition duration-150 data-open:scale-100 data-open:opacity-100 data-closed:scale-95 data-closed:opacity-0">
            <div className="mb-3 w-16 nox-avatar-slot">
              <NoxPixelMascot state="error" label="Nox warning before sign out" className="h-auto w-full" />
            </div>
            <AlertDialog.Title className="font-heading text-lg font-semibold tracking-wide">
              Leave the system?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You’ll be signed out of this device and returned to the Hunter login screen.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Close render={<Button type="button" variant="outline" />}>
                Stay logged in
              </AlertDialog.Close>
              <form action={signOut}>
                <Button type="submit" variant="destructive">
                  <LogOut className="size-4" strokeWidth={2} />
                  Sign out
                </Button>
              </form>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
