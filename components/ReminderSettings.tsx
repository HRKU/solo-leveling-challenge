'use client'

import { useEffect, useState, useTransition } from 'react'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { savePushSubscription, deletePushSubscription } from '@/app/actions/push'

// PushManager.subscribe wants the VAPID public key as an ArrayBuffer-backed
// Uint8Array (Uint8Array.from() types as ArrayBufferLike, which TS rejects).
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

type Support = 'checking' | 'supported' | 'needs-install' | 'unsupported'

export function ReminderSettings() {
  const [support, setSupport] = useState<Support>('checking')
  const [enabled, setEnabled] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      // iOS Safari only exposes PushManager inside an installed (home screen)
      // app — nudge those users to install instead of showing a dead end.
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      setSupport(isIos && !isStandalone ? 'needs-install' : 'unsupported')
      return
    }
    setSupport('supported')
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(Boolean(sub)))
      .catch(() => setEnabled(false))
  }, [])

  function toggle(next: boolean) {
    startTransition(async () => {
      try {
        if (next) {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') {
            toast.error('Notifications are blocked for this site.')
            return
          }
          const reg = await navigator.serviceWorker.ready
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
          })
          const json = sub.toJSON()
          const result = await savePushSubscription({
            endpoint: sub.endpoint,
            keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
          })
          if (result.error) {
            await sub.unsubscribe()
            toast.error(result.error)
            return
          }
          setEnabled(true)
          toast.success('Daily reminders enabled on this device.')
        } else {
          const reg = await navigator.serviceWorker.ready
          const sub = await reg.pushManager.getSubscription()
          if (sub) {
            await deletePushSubscription(sub.endpoint)
            await sub.unsubscribe()
          }
          setEnabled(false)
          toast.success('Reminders disabled on this device.')
        }
      } catch {
        toast.error('Could not update reminder settings.')
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
          <div>
            <p className="text-sm font-medium">Daily reminders</p>
            <p className="text-xs text-muted-foreground">
              {support === 'needs-install'
                ? 'Install the app first: Share → Add to Home Screen, then enable this from the installed app.'
                : support === 'unsupported'
                  ? 'This browser does not support notifications.'
                  : 'A morning nudge, and an evening warning if you haven’t logged. Per device.'}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={toggle}
          disabled={support !== 'supported' || pending}
          aria-label="Toggle daily reminders"
        />
      </CardContent>
    </Card>
  )
}
