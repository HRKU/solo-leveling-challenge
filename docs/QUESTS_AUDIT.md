# Quests — current-state audit

Exploration notes only (not a spec) — context for brainstorming the next Quests pass. Delete/fold into `PRODUCT.md` once a direction is picked.

## Where it lives

- Route: `/quests`, nav item "Quests" (`Sparkles` icon, both desktop top nav and mobile bottom nav in `NavBar.tsx`).
- Files: `app/quests/page.tsx` (server, fetches) → `components/QuestsList.tsx` (post form + list) → `components/ChallengeCard.tsx` (one quest) → `app/actions/challenges.ts` (`createChallenge`, `toggleChallengeCompletion`) → `supabase/migrations/0003_challenges.sql` (`challenges`, `challenge_completions`).

## What it does today

- **Post a quest**: any member — title (required), optional description, XP reward (1–1000, default 50). Always scoped to the calendar month it's posted in (`start_date`/`end_date` locked server-side to that month). Group-wide, insert-only — **no edit/delete**, ever, by design ("fairness" comment in the migration).
- **List**: shows only *this* month's quests (`start_date = currentMonthStart()`), newest first. No way to browse past months at all — once the month rolls over, old quests (and who did what) disappear from the UI entirely (data isn't deleted, just unreachable).
- **Complete a quest**: per-user self-reported toggle (a `Switch`), no proof required. Flipping it shows/hides your initials avatar in a row of everyone who's completed it. XP is never trusted from the client — always `resumTotalXp()` after toggling, same pattern as daily check-ins.
- Card UI: title, description, an XP badge (`⚡ N XP`), a row of circular initials avatars for completers, then a label + switch footer. Plain `Card`, no visual distinction between quests, no sense of urgency/deadline, no empty per-quest state beyond the avatar row not rendering.
- Empty state (no quests this month): one centered line of muted text under the post form.

## Real usage (prod data, as of this audit)

- **12** onboarded group members.
- **3** quests total, ever — all posted in the current month (Jul 2026), by only **2** of the 12 members.
- **1** `challenge_completions` row total, and it's `completed = false` (someone toggled on then back off) — i.e. **zero** net completions recorded, despite 3 quests being live.
- Reads as a feature almost nobody has engaged with yet, not just "quiet this month."

## Rough edges / gaps observed

- No history — can't see last month's quests or who won them once the month ends.
- No editing typos or reward tweaks post-creation (even by the creator), and no delete for a joke/duplicate post.
- No deadline visibility on the card itself (end-of-month is implicit, not shown).
- No notification/highlight when a new quest is posted (easy to miss unless someone checks `/quests`).
- No sorting/prioritization — newest-first only; a quest with 0 completions looks identical in weight to one everyone's done.
- No photo/proof option — pure honor system (already flagged as a "maybe" in `FUTURE_IDEAS.md`).
- No per-user "quests I've completed all-time" view — completions are only visible per-quest, in-the-moment.
- Post form and quest list share one page/scroll with no separation between "create" and "browse" — the form is always at the top, above every quest.

## Visual / celebration comparison (live UI walkthrough)

Logged in as the test account and compared "reward moments" across the app side by side:

| Surface | Celebration level | Treatment |
|---|---|---|
| Leaderboard #1 (`ChampionCard`) | High | Gold ring + radial glow (`champion-glow`), animated crown (`champion-crown`), dedicated larger layout |
| Dashboard hero (`DashboardHero`) | Medium-high | Rank-tinted gradient card, rank medallion, flickering streak flame, gradient XP bar |
| Calendar day cell | Low-medium | Color-coded dot (hit/partial/miss), today ring — subtle but legible at a glance |
| **Quests — completing one** | **Very low** | A `Switch` flips color and the label swaps "Mark as done" → "Completed." That's it. |

Confirmed by actually toggling a quest's completion switch: `total_xp` genuinely updates (visible on `/` after revalidation), but there is **no toast, no animation, no XP-gain feedback, no card state change** — a completed quest card is pixel-identical to an incomplete one except the switch color. This is the single biggest gap: the app already has a whole visual language for "this is a special/rewarded moment" (`champion-glow`, `champion-crown`, `flame-flicker`, `logo-glow` in `globals.css`), but none of it is reused here, so finishing a quest feels like flipping a settings toggle rather than completing a dare.

Two more gaps that surfaced from re-reading `lib/xp.ts` / grepping for toasts while comparing:

- **Nothing in the app celebrates leveling up or ranking up**, anywhere — not just Quests. `upsertDailyCheckin`/`toggleChallengeCompletion` silently recompute `total_xp`/`level`/`rank` server-side and the UI just reflects the new number on next render. So "juice" for quest completion could double as the app's first celebration moment in general, not a quests-only fix.
- **No cross-over with push reminders** (`app/api/reminders/route.ts`) — the cron only sends a generic morning nudge and an evening streak warning; it has no idea quests exist, so there's no "new quest posted" or "quest ending soon" nudge.
- Quests also have no visual difficulty/rarity signal beyond the raw XP number, and no per-quest deadline chip — both called out above, but worth restating since they compound the "administrative" feel (a 25 XP and a 1000 XP quest render identically apart from one digit).

## Related ideas already on the shelf (`FUTURE_IDEAS.md`)

- Quest photo proof (optional, creator-required).
- Sub-squads/parties for team-vs-team quest competitions.
- Weekly recap card (could surface quest wins).
