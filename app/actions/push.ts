'use server'

import { createClient } from '@/lib/supabase/server'

export interface PushActionState {
  error?: string
  success?: boolean
}

// Called from ReminderSettings with the browser's PushSubscription JSON.
// Upserts on endpoint so re-enabling on the same device refreshes the row
// instead of erroring on the unique constraint.
export async function savePushSubscription(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<PushActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { endpoint, keys } = subscription
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return { error: 'Invalid subscription.' }
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function deletePushSubscription(endpoint: string): Promise<PushActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // RLS restricts the delete to the caller's own rows regardless.
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
