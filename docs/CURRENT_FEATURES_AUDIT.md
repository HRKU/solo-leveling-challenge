# Current Features & Product Audit

**Snapshot date:** 5 September 2026

**Scope:** Features implemented in the application and database. This is not a future-feature backlog.

## Executive summary

Solo Leveling Challenge is already a complete small-group fitness tracking product, not merely a workout form. Its core loop combines structured daily logging, personalized targets, server-controlled XP, streaks, ranks, social comparison, weekly analysis, and private evidence-based quests.

The top priority should now be **product instrumentation and core-loop validation**, not another large feature. The application currently cannot answer basic product questions such as:

- How many invited users complete onboarding?
- How many complete a first check-in and return the following week?
- Where do users abandon the check-in form?
- How many users opt into Weekly Hunter Reports?
- How many become report-eligible, receive quests, and complete them?
- Which quest types are useful, too easy, or routinely expire?

Until those answers exist, further feature work is mostly based on intuition. The next investment should establish a small, privacy-conscious event model and a core retention funnel, then use that evidence to choose the next product improvement.

## Primary product loop

1. A user joins through the invite-only signup flow.
2. Onboarding captures the profile data required for personalized targets.
3. The user records workouts and daily essentials.
4. The server calculates XP, streak, level, and Hunter rank.
5. Calendar, dashboard, and leaderboard make progress visible.
6. Eligible opted-in users receive a Weekly Hunter Report.
7. The report selects three measurable Personal Quests for the following week.
8. New check-ins update quest progress and award quest XP automatically.

This is the application’s strongest differentiator and should be measured as one connected funnel.

## Current feature inventory

### 1. Authentication and access

**Status: Implemented**

- Invite-code-protected account creation.
- Email/password sign-in and sign-out.
- Password reset and password update flows.
- Automatic profile creation for new Supabase Auth users.
- Protected application routes and onboarding gate.
- Post-login Awakening transition.
- Generic authentication errors that avoid revealing account existence.

**Current limitation:** Signup security depends on public Supabase signup remaining disabled in the project configuration, as documented in the README.

### 2. Onboarding and personalized targets

**Status: Implemented**

- Captures name, age, sex, height, current/starting weight, goal, and target weight.
- Requires the necessary profile fields before entering the main application.
- Calculates personalized calorie, protein, and water targets.
- Uses fixed sleep and step targets.
- Keeps progression fields such as total XP, level, rank, and streak server-controlled.

**Current limitation:** Target calculations use a deliberately simple activity assumption and do not account for training schedule, medical conditions, or wearable data.

### 3. Daily check-ins

**Status: Implemented and central to the product**

- Today’s check-in on the dashboard.
- Past-date backfill and editing through `/checkin/[date]`.
- Future dates blocked.
- Structured workout logger with exercises, sets, repetitions, duration, and optional weight.
- Daily water, sleep, steps, protein, calories, and notes.
- Shared validation between the client experience and server write path.
- Clear create/update feedback and Nox success presentation.
- Past-day edits do not alter the current streak.

**Current limitation:** Check-ins are manual. There is no offline queue, draft recovery, wearable import, or autosave.

### 4. Exercise catalogue and workout scoring

**Status: Implemented**

- Curated exercise catalogue grouped by push, pull, legs, arms, core, hold, and cardio.
- Supports bodyweight repetitions, weighted repetitions, duration, and weighted-duration logging modes.
- Scoring v3 uses exercise difficulty multiplied by repetitions or duration.
- Workout XP is uncapped; logged weight does not increase XP.
- Habit XP is ratio-based and capped at each daily target.
- Stores scoring version and breakdown for auditability.
- Preserves classic exercise aggregates for compatibility with existing calendar behavior.

**Current limitation:** The catalogue is code-defined rather than user-extensible. There are no workout templates, routines, or planned sessions.

### 5. XP, levels, ranks, and streaks

**Status: Implemented**

- Daily check-in XP.
- Group quest XP.
- Personal quest XP.
- Self-healing total-XP resummation instead of fragile incremental totals.
- Increasing level thresholds.
- Hunter ranks from E through S.
- Daily streak based on the existence of a check-in row.
- Server protection for derived progression fields.

**Current limitation:** There is no XP ledger visible to users, so they cannot inspect every source contributing to the displayed total.

### 6. Dashboard and Nox companion

**Status: Implemented**

- Personalized welcome and current daily directive.
- Rank, level, XP progress, and streak hero.
- Weekly report status and generation surface.
- Today’s check-in form and missed-day entry point.
- Nox mascot states for idle, loading, success, and error.
- Per-device Nox visibility/preferences.

### 7. Calendar and check-in history

**Status: Implemented**

- Monthly habit-completion calendar.
- Logged-day, elapsed-day, and monthly-XP summaries.
- Habit status indicators using the stored scoring breakdown.
- Read-only detail modal for historical days.
- Editing entry point for existing historical check-ins.
- Confirmation before logging an empty historical date.
- Future dates disabled.

**Current limitation:** History is calendar-oriented. There is no exercise-specific historical timeline or searchable workout log.

### 8. Body progress

**Status: Implemented**

- Weekly weight and optional body-fat check-in.
- One entry per user per week with update support.
- Current profile weight synchronized from weekly weigh-ins.
- Weight trend visualization.
- History table with week-to-week changes.
- Favorable/unfavorable direction based on the selected goal.

**Current limitation:** Analytics are limited to weight and body fat; there are no measurement, photo, strength, or exercise-volume trends.

### 9. Leaderboard

**Status: Implemented**

- Shared leaderboard for onboarded members.
- Ordered by authoritative total XP.
- Rank and level display.
- Highlight for the current user.
- Champion presentation for first place.
- Responsive mobile and desktop layouts.

**Current limitation:** The leaderboard is lifetime-based. There are no seasons, archived standings, or time-bounded comparisons.

### 10. Group quests

**Status: Implemented**

- Members can post free-text challenges for the current month.
- Creator chooses the bonus XP value within database/application limits.
- Members self-report completion.
- Completion is visible to the group.
- XP is included through authoritative resummation.

**Current limitation:** Group quests intentionally rely on trust. They do not validate completion from workout data, and creator-selected XP can affect competitive balance.

### 11. Weekly Hunter Reports

**Status: Implemented, conditional, and private**

- Explicit per-user opt-in.
- Requires a complete profile, at least three logged days, at least two workout days, and structured exercise data.
- Aggregates a completed Monday–Sunday week.
- Compares with eligible recent personal baselines when sufficient history exists.
- Includes exercise, habit, and body-trend evidence.
- Uses Groq for the private narrative report.
- Provides deterministic fallback report wording if AI generation fails.
- Stores report generation status and minimized source evidence privately.
- Supports detailed historical report pages.

**Current limitation:** Reports are generated when an eligible user visits the dashboard rather than through a scheduled background job. AI failure currently produces a fallback report with a failed state.

### 12. Personal Weekly Quests

**Status: Implemented and integration-tested**

- Available only through the opted-in Weekly Hunter Report flow.
- Builds a server-approved pool of measurable quest candidates from weekly evidence.
- AI may rank valid candidates but cannot invent quest types, exercises, targets, completion rules, or XP.
- Invalid AI selections fall back to deterministic ranking.
- Report missions and issued quests use the same selected quest set.
- Uses recent quest history to reduce repetition and deprioritize previously expired variants.
- Applies beginner-friendly progression and bounded targets.
- Selects three varied quests with at least one consistency/workout focus, no duplicate quest type, and no repeated exercise focus.
- Supports:
  - Check in on a number of days.
  - Complete workouts on a number of days.
  - Meet a water, sleep, steps, or protein target on a number of days.
  - Log a named exercise in a number of sessions.
  - Complete total repetitions of a named exercise.
  - Complete total sets of a named exercise.
  - Accumulate total minutes of a duration exercise.
- Runs for the following Monday–Sunday period.
- Reconciles progress from stored check-ins and structured workouts.
- Completes and timestamps the XP award atomically.
- Prevents completion after expiry and prevents duplicate awards.
- Displays active, completed, and expired states with progress units.
- Owner-only RLS; clients cannot modify quest state.

**Current limitation:** There is no user-facing explanation of why a particular candidate won the ranking, no quest replacement mechanism, and no aggregate quest-performance view.

### 13. Notifications and PWA

**Status: Implemented with platform limitations**

- Installable web manifest and application icons.
- Push subscription management per device.
- Morning reminder for subscribed devices.
- Evening reminder for users without a check-in that day.
- Dead push subscriptions removed after permanent delivery failures.
- Cron endpoint protected by a secret.

**Current limitations:**

- Reminder timing is globally scheduled rather than configurable per user.
- iOS notification support requires installing the PWA.
- The service worker handles push display only; the app does not work offline.

### 14. Settings and preferences

**Status: Implemented**

- Hunter profile editing.
- Nox companion preferences.
- Dark/system appearance preference.
- Per-device notification controls.
- Weekly AI report opt-in.
- Account email display, password recovery entry point, and sign-out.
- Application/version information.

## Security and integrity posture

The application has meaningful trust boundaries rather than relying entirely on the browser:

- Authentication is verified inside server actions.
- Sensitive scoring and progression writes use trusted server paths.
- Direct client updates to server-derived XP fields are revoked.
- Personal reports, preferences, and quests use owner-only RLS.
- Personal quest writes are server-only.
- Quest completion and XP-award timestamps are reconciled transactionally in Postgres.
- Public/group data and private/personal data use different access policies.
- Total XP is recomputed from source records and can self-heal after partial application failures.

The largest remaining operational weakness is visibility: there is no error-monitoring or product-event system showing failures, latency, adoption, or abnormal behavior in production.

## Quality and delivery maturity

### Present

- Strict TypeScript configuration.
- ESLint with Next.js rules.
- Production builds used for verification.
- Focused scoring, validation, weekly-report, and personal-quest smoke scripts.
- Live personal-quest integration coverage for RLS, duplicates, all quest progress types, expiry, and one-time awards.
- Versioned SQL migrations and package lockfile.

### Missing or incomplete

- No standard unit-test runner configured in `package.json`.
- No visible continuous-integration workflow enforcing lint, type checks, builds, and tests on every change.
- No product analytics/event schema.
- No application error monitoring or alerting.
- No documented backup/restore or incident procedure.
- README migration/setup instructions do not yet list the weekly-report and personal-quest migrations (`0009`–`0013`).
- `docs/PRODUCT.md` does not yet fully describe the new Personal Quests behavior.

## Highest-priority recommendation

### Instrument and validate the core retention loop

This is the highest-leverage next step because the application already has enough features to test its product thesis. More mechanics will increase complexity without revealing whether users consistently receive value.

#### Minimum event model

Track server-confirmed events rather than arbitrary client clicks:

- `onboarding_completed`
- `daily_checkin_created`
- `daily_checkin_updated`
- `weekly_checkin_created`
- `weekly_report_opted_in`
- `weekly_report_eligible`
- `weekly_report_ready`
- `weekly_report_failed`
- `personal_quests_issued`
- `personal_quest_completed`
- `personal_quest_expired`
- `push_subscription_enabled`

Events should use an internal user ID, timestamp, event type, and a small allow-listed metadata object. Do not copy health notes, raw workout payloads, body measurements, report text, or other sensitive content into analytics.

#### First metrics to review

- Invite accepted → onboarding completion.
- Onboarding → first check-in.
- First check-in → second check-in within seven days.
- Week-one and week-four active retention.
- Percentage of active users eligible for a weekly report.
- Report opt-in, success, and failure rates.
- Personal quests issued per eligible report.
- Completion/expiry rate by quest type and target band.
- Median time required to complete a daily check-in.
- Push opt-in rate and return/check-in rate after reminders.

#### Decision enabled by this work

After two to four weeks of real usage, the next product priority becomes evidence-based:

- Low onboarding completion → simplify onboarding.
- Low first-check-in completion → reduce form friction or add templates.
- Low week-one return → improve reminders and daily motivation.
- Low report eligibility → adjust eligibility or help users log structured workouts.
- High report use but low quest completion → tune targets, ranking, or quest explanations.
- Strong retention but demand for richer training → build routines or exercise analytics.

## Recommended order after instrumentation

1. Fix the largest measured activation or retention drop-off.
2. Add operational error monitoring and alerts if not included with instrumentation.
3. Add a quest-history/weekly-outcome view if Personal Quests demonstrate usage.
4. Add workout templates or routines if check-in friction is the main problem.
5. Add exercise progress analytics if users consistently log structured workouts.

## Explicitly not current features

The following should not be represented as available today:

- Smart post-check-in coaching/feedback analysis.
- Wearable or health-platform synchronization.
- Offline check-in queue.
- Planned workout routines or calendar scheduling.
- User-created exercises.
- Exercise-level trend dashboards.
- Seasonal leaderboard resets or archived seasons.
- Parties, squads, rivals, titles, or cosmetic stat allocation.
- Automated medical, recovery, or injury guidance.

## Audit conclusion

The application’s feature breadth is sufficient for a real small-group release. Its most important next move is to become observable: measure whether people reach and repeat the core loop, whether weekly reports unlock, and whether Personal Quests change behavior. That evidence should choose the next feature—not the other way around.
