# Application Performance & Navigation UX Plan

## Goal

Make every navigation feel acknowledged immediately, then reduce the actual server and database work required to show useful content. Preserve Supabase RLS and fresh personal data.

## Success Targets

- Click feedback: under 100 ms.
- Warm page shell: under 500 ms.
- Useful content: around 1 second on a typical connection.
- No cross-user caching of private data.

## Delivery Phases

### 1. Immediate feedback

- Add pending feedback to desktop and mobile navigation.
- Keep a global Nox loading boundary.
- Add destination-shaped loading states for core and dynamic routes.

**End state:** a click never appears ignored.

### 2. Shorten the critical path

- Stream slow dashboard sections independently.
- Keep AI report loading from blocking the daily check-in interface.
- Deduplicate profile reads and select only required columns.

**End state:** useful page content renders before secondary data.

### 3. Optimize authentication safely

- Use verified JWT claims in the navigation proxy.
- Retain fresh `getUser()` verification for sensitive mutations.
- Confirm asymmetric JWT signing so claims verification is local/cached.
- Move repeated onboarding lookups out of the per-navigation proxy after route-group validation is tested.

**End state:** most navigations do not wait on the Auth server.

### 4. Cache selectively

- Consider short-lived caching for shared leaderboard and quest data.
- Use request-level deduplication for private reads.
- Never put check-ins, settings, sessions, or private reports in a shared cache.

**End state:** shared reads are cheaper without stale or leaked personal data.

### 5. Measure and tune

- Compare route timings and Supabase request counts before and after each phase.
- Check Vercel and Supabase region alignment.
- Test direct URLs, expired sessions, onboarding, logout, slow networks, and mobile navigation.

## Technical Approach

- Next.js App Router `Link`, `useLinkStatus`, `loading.tsx`, and Suspense streaming.
- Supabase SSR with `getClaims()` for verified page access and RLS for row authorization.
- `getUser()` remains on server mutations where fresh user validation is appropriate.
- Cache only data with an explicit freshness and privacy policy.

## Rollout Rule

Implement one phase at a time, run TypeScript/lint checks, and verify authentication behavior before proceeding to broader caching or route restructuring.

## Current Status

- Phase 1: implemented for primary navigation and core routes.
- Phase 2: dashboard weekly-report streaming implemented; further query deduplication remains.
- Phase 3: implemented with verified ES256 claims and a server-controlled onboarding claim. Migration `0010` backfills existing users; deployment remains.
- Phase 4: pending measurement after migration deployment; no private shared caching will be introduced.
- Phase 5: local measurements recorded; production measurement remains.

## Baseline Measurement — 2026-09-04

Local authenticated development run, five primary route transitions:

- Previous proxy using `getUser()`: 2.04 s average.
- Optimized proxy using `getClaims()`: 1.67 s average.
- Observed improvement: about 18%; production measurement is still required.
- Project signing key: asymmetric ES256, so claims verification can use cached public keys.
- At this baseline, one Auth-server request had been removed; Phase 3 subsequently removes the repeated onboarding profile lookup as well.

### Phase 3 expected request count after migration

- Proxy authentication: local/cached claims verification; no profile query.
- Leaderboard: 1 Supabase data request.
- Calendar and Progress: 2 data requests each.
- Quests and Settings: 3 requests each.
- Dashboard with weekly report: 6 requests, with report work streamed outside the primary content path.
