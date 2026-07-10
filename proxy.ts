import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Excluded from the auth gate:
  //  - manifest.webmanifest: browsers fetch it without credentials — the
  //    redirect would break PWA installability
  //  - sw.js: service worker script fetches must not be redirected, or the
  //    browser rejects/unregisters the worker
  //  - api/: route handlers do their own auth (the cron sender authenticates
  //    via CRON_SECRET, not a session cookie)
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
