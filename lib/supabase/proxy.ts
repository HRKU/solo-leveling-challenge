import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verify the cookie-backed access token. With asymmetric signing keys this
  // uses cached public keys instead of putting the Auth server on every route's
  // critical path; the SSR client still propagates refreshed cookies.
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = typeof claimsData?.claims.sub === 'string' ? claimsData.claims.sub : null
  const appMetadata = claimsData?.claims.app_metadata
  const onboarded = appMetadata && typeof appMetadata === 'object' && 'onboarded' in appMetadata
    ? (appMetadata as { onboarded?: unknown }).onboarded
    : null

  const path = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some((route) => path.startsWith(route))

  if (!userId && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (userId && isPublicRoute && !path.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Pass the already-verified user id down to Server Components via a
  // *request* header (not a response header — those aren't visible to the
  // render pipeline, only to the browser), so pages can read it directly
  // instead of repeating identity resolution in every page. RLS on the actual
  // data queries is unaffected either way — auth.uid() is independently
  // verified by PostgREST from the request's cookies regardless of this
  // header's value.
  if (userId) {
    request.headers.set('x-user-id', userId)
    request.headers.delete('x-user-onboarded')
    if (typeof onboarded === 'boolean') {
      request.headers.set('x-user-onboarded', String(onboarded))
    }
    const responseWithUserHeader = NextResponse.next({ request })
    // Preserve any refreshed session cookies Supabase already queued onto
    // supabaseResponse via the setAll callback above.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      responseWithUserHeader.cookies.set(cookie)
    })
    return responseWithUserHeader
  }

  return supabaseResponse
}
