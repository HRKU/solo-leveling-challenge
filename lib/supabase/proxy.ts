import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup']
const ONBOARDING_ROUTE = '/onboarding'

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

  // IMPORTANT: do not remove — refreshes the auth token if expired.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some((route) => path.startsWith(route))
  const isOnboardingRoute = path.startsWith(ONBOARDING_ROUTE)

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (user && !isOnboardingRoute && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarded) {
      const url = request.nextUrl.clone()
      url.pathname = ONBOARDING_ROUTE
      return NextResponse.redirect(url)
    }
  }

  if (user && isOnboardingRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', user.id)
      .single()

    if (profile?.onboarded) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Pass the already-verified user id down to Server Components via a
  // *request* header (not a response header — those aren't visible to the
  // render pipeline, only to the browser), so pages can read it directly
  // instead of calling supabase.auth.getUser() a second time. That call
  // always makes a fresh network round-trip to the Auth server, and doing
  // it twice per navigation (once here, once per page) was a real chunk of
  // the ~1s+ this proxy was adding to every route change. RLS on the actual
  // data queries is unaffected either way — auth.uid() is independently
  // verified by PostgREST from the request's cookies regardless of this
  // header's value.
  if (user) {
    request.headers.set('x-user-id', user.id)
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
