import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

/**
 * The user id, already verified by proxy.ts's supabase.auth.getUser() call
 * and forwarded via the x-user-id request header. Reading it here avoids a
 * second network round-trip to the Auth server on every page — RLS still
 * independently verifies auth.uid() on every actual data query regardless,
 * so this is purely a latency optimization, not a weaker trust boundary.
 * Server Actions should keep calling supabase.auth.getUser() directly —
 * writes are a more sensitive boundary and aren't on the hot navigation path.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const h = await headers()
  return h.get('x-user-id')
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore because the
            // proxy (Next.js 16's renamed middleware) refreshes the session
            // on every request.
          }
        },
      },
    }
  )
}
