# Personal Quests & Smart Feedback

Two independent engagement features. Build and review each on its own branch.

## Feature 1 — Personal Weekly Quests

**Branch:** `codex/personal-weekly-quests`

### Goal

Turn the three weekly Hunter Report missions into private, measurable quests that reward consistent activity without allowing duplicate or manual XP abuse.

### Product behavior

- Add a **Personal Quests** section to the existing Quests page.
- Create up to three quests when an eligible weekly report is completed.
- Quests run for the following Monday–Sunday period, then expire.
- Show target, current progress, expiry, XP reward, and status.
- Derive progress automatically from check-ins and structured workouts.
- Award XP once when the target is reached and show a Nox completion celebration.
- Do not penalize expired or incomplete quests.

### Quest model

Each quest stores:

- User and source report IDs
- Structured quest type and parameters
- Display title and description
- Target, progress, start/end dates, and status
- XP reward and one-time award timestamp

Initial quest types:

- Check in on N days
- Complete N workout days
- Meet a habit target on N days
- Log a named exercise on N sessions

### Generation and integrity

- Application rules select quest types from report evidence and available tracking fields.
- AI may improve wording only; it cannot define completion logic or XP.
- Deduplicate by user, report, and quest type.
- Complete and award XP through one idempotent server transaction.
- Apply owner-only RLS; personal quests never enter public APIs.
- Recalculate total XP using the existing authoritative XP flow.

### Delivery steps

1. Add schema, constraints, indexes, and RLS.
2. Build deterministic quest selection and reward tiers.
3. Create quests after successful weekly-report generation.
4. Add Personal Quests UI with active, completed, and expired states.
5. Reconcile progress after check-in saves and protect one-time XP awards.
6. Add focused tests for generation, expiry, progress, and duplicate prevention.

### Acceptance criteria

- Eligible reports create measurable, non-duplicate quests.
- Progress matches recorded check-ins without manual completion.
- XP cannot be claimed twice or earned after expiry.
- One user cannot read or modify another user’s quests.
- Report or AI failure does not affect normal check-ins or shared quests.

## Feature 2 — Smart Check-in Feedback

**Branch:** `codex/smart-checkin-feedback`

### Goal

Show one accurate, useful observation immediately after a check-in without delaying the save flow or requiring an LLM call.

### Product behavior

- Add the observation to the existing success splash and toast.
- Return one primary insight, not a list of generic messages.
- Compare the saved entry with daily targets and recent personal history.
- Use positive, neutral language; avoid diagnosis and unsafe training advice.

### Initial rule priority

1. Recovery watch point, such as sleep below the recent average after training.
2. Streak or repeated-target achievement.
3. Meaningful workout-volume change against a valid baseline.
4. Remaining daily habit targets.
5. Simple confirmation when evidence is insufficient.

Each rule returns a structured insight type, evidence values, priority, and deterministic fallback text. Missing data is never treated as zero.

### AI boundary

- Deterministic rules decide the fact and priority.
- Initial release uses deterministic wording only.
- Optional later enhancement: Groq asynchronously rephrases the selected fact.
- The LLM receives only the chosen evidence, cannot introduce new claims, and never blocks submission.

### Delivery steps

1. Define the insight contract and minimum baseline requirements.
2. Implement and unit-test deterministic rules.
3. Evaluate feedback after the check-in transaction succeeds.
4. Return the insight with the action response and render it in the success UX.
5. Measure response time and rule usefulness before adding AI wording.

### Acceptance criteria

- Feedback reflects only stored data and appears after confirmed saves.
- Selection is deterministic and produces at most one insight.
- Missing or sparse history produces a safe fallback.
- Check-in latency is not materially increased.
- AI unavailability cannot remove or delay feedback.

## Recommended sequence

1. Build Personal Weekly Quests first because it establishes structured mission rules.
2. Reuse those rule and evidence patterns for Smart Check-in Feedback.
3. Add optional AI language only after both deterministic systems are stable.
