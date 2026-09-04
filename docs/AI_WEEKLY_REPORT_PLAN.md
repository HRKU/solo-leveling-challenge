# AI Weekly Hunter Report — implementation plan

Canonical plan for an opt-in, private weekly report written in Nox's voice. The application calculates the facts; the LLM only explains them and suggests small next steps.

## End goal

- Give active users one concise, useful report for each completed week.
- Compare users primarily with their own recent performance, not other people.
- Use workout, recovery, habit, goal, and body-trend data without making medical or unsupported capacity claims.
- Make no LLM call unless the user opted in and supplied enough data.
- Deliver inside the application first; email and PDF are out of scope for v1.

## Report eligibility — frozen for v1

Generate a report only when all conditions are true:

- Weekly reports are enabled.
- Onboarding and required body profile fields are complete.
- The reporting week has ended.
- At least **3 daily check-in days** exist.
- At least **2 workout days** exist.
- At least **1 workout** contains structured exercise details.
- A report does not already exist for that user and week.

Otherwise, make no LLM call and show the specific missing requirement. “Inactive” means insufficient data for this report only; it is not a judgment about the user.

## Benchmark rules

- Compare the completed week with the user's previous **4 eligible weeks**.
- Require at least **2 previous eligible weeks** for trend claims; otherwise show “Baseline still forming.”
- Weighted exercise: sessions, sets, reps, total load volume, and highest logged weight.
- Bodyweight exercise: sessions, sets, and total reps.
- Duration exercise: sessions, total duration, and longest set.
- Recovery and habits: workout spacing, sleep, steps, protein, calories, and water.
- Body trend: weekly/four-week weight direction compared with the selected goal.
- Never use leaderboard users, population strength tables, BMI labels, or assumed physical capacity as benchmarks.

## LLM payload

Send a compact server-calculated summary containing:

- Age band, sex, height, current weight, target weight, and goal.
- Check-in/workout counts and total workout time.
- Per-exercise weekly totals and changes against personal baseline.
- Weekly habit averages and adherence to app-calculated targets.
- Weight/body-fat trend when available.
- Explicit flags for missing data and whether a baseline exists.

Do not send names, email addresses, user IDs, invite data, raw check-in rows, or free-text notes. Every number quoted by the report must already exist in the calculated payload.

## Report contract

Target length: **150–220 words** with these fixed sections:

1. Weekly verdict — one sentence.
2. Strongest progress — one evidence-backed observation.
3. Watch point — one consistency, balance, or recovery observation.
4. Exercise insight — comparison with personal baseline.
5. Body-goal insight — cautious directional observation.
6. Next week's missions — exactly three small actions.
7. Nox closing line — short and thematic.

The report must not diagnose, prescribe treatment, invent facts, promise outcomes, or state what a user can safely lift or endure.

## Technical approach

- **Data:** Supabase `profiles`, `daily_checkins`, and `weekly_checkins`.
- **Preferences:** private per-user setting; disabled by default with explicit consent copy.
- **Reports:** private per-user records, unique by `(user_id, week_start)`, protected by owner-only RLS.
- **Aggregation:** deterministic server-side TypeScript functions; the browser never builds the AI payload.
- **Generation:** lazy generation on the first dashboard/progress visit after the week ends.
- **Provider:** Groq behind a small provider adapter.
- **Model order:** `openai/gpt-oss-20b` → `qwen/qwen3.6-27b` → `openai/gpt-oss-120b`.
- **Output:** strict JSON Schema plus server-side validation.
- **Limits:** one successful generation per eligible user/week, short prompt/output caps, timeout, and bounded fallback attempts.
- **Failure fallback:** show a deterministic non-AI weekly summary; never block the dashboard.
- **Observability:** store model, generation status, token usage, failure category, and prompt/schema version—never the API key.

## Delivery steps

### Phase 1 — data and consent

- Add weekly-report preference and consent text in Settings.
- Add private report storage, owner-only RLS, and the weekly uniqueness constraint.
- Implement eligibility statuses and missing-data messages.

### Phase 2 — deterministic analysis

- Aggregate the completed week and personal baseline.
- Calculate exercise, habit, recovery, and body-goal comparisons.
- Build and validate the privacy-filtered payload.
- Unit-check eligibility boundaries and benchmark calculations.

### Phase 3 — AI generation

- Add the Groq provider adapter, model fallback order, limits, and timeouts.
- Define the strict report schema and Nox system instructions.
- Validate output and save only a successful report.
- Provide the deterministic fallback when generation fails.

### Phase 4 — application experience

- Add a dashboard preview and a full in-app report view.
- Show locked/insufficient-data, generating, ready, and failed states using Nox.
- Keep mobile and laptop layouts responsive and respect reduced-motion settings.

## Acceptance checks

- Opted-out and ineligible users cause **zero** LLM calls.
- The same user/week cannot generate duplicate reports.
- Another authenticated user cannot read a user's preference, payload, or report.
- Reports use only server-calculated facts and follow the fixed schema/length.
- Missing baselines produce no false trend claims.
- Provider errors and rate limits fall back cleanly without breaking navigation.
- Settings consent, report states, and the full report work on mobile and laptop.

## Deferred

- Email delivery, PDFs, scheduled bulk generation, wearable data, population benchmarks, medical advice, and automated workout prescriptions.
- A later capacity-aware version may add optional session difficulty, post-workout feeling, pain/discomfort, and RPE inputs.
