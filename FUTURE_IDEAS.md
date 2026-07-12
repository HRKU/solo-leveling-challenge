# Future Ideas (rough brainstorm, unplanned)

Just a dump of directions worth considering next. Nothing here is scoped or committed to — pick whatever sounds fun when the group wants more.

## Solo Leveling flavor
- **Gate/Boss events** — a monthly group goal (e.g. combined pushups across everyone) rendered as a "boss HP bar" draining as people log. Big shared payoff when it hits zero.
- **Titles** — unlockable badges shown next to your name (e.g. "Iron Will" at 1000 lifetime pushups, "Reawakened" for a 30-day streak). Pure flavor, cheap to add, very on-theme.
- **Stat allocation** — cosmetic STR/VIT/AGI points earned per level-up, spent by the user. No mechanical effect, just RPG feel on the profile page.
- **Seasonal "arcs"** — reset the leaderboard every month/season like a story arc, archive the previous season's final standings instead of scrolling one endless list forever.

## Social / group dynamics
- **Rival pick** — choose someone near you on the leaderboard as a "rival"; get a small callout when they pass you. Cheap, high engagement.
- **Weekly recap card** — auto-generate a shareable image/summary (XP gained, rank change, streak) people can drop straight into the group chat instead of screenshotting the app.
- **Sub-squads / parties** — let the friend group split into 2-3 teams for team-vs-team quest competitions instead of always fully individual.

## Retention / habit mechanics
- **Miss-a-day debuff** — small temporary XP penalty or "weakened" status after a broken streak, instead of just losing the streak counter silently. Adds a bit of loss-aversion.

## Data / insight
- **Personal trends view** — best day of week, average reps over time, water/streak correlation — light analytics beyond the current weight-trend chart.
- **Wearable sync** — pull steps/workouts from Google Fit/Apple Health to auto-fill part of the daily check-in instead of manual entry.

## Infra / polish
- **Offline check-in queue** — extend the existing push-only service worker so a check-in can be queued when signal is bad at the gym and flushed on reconnect.
- **Quest photo proof (optional)** — let a quest creator require an image attached to the completion toggle instead of pure honor system, for the dares where that matters.

---
## Already shipped (don't re-plan)

- **Installable PWA** — web manifest, icon set, Apple web-app meta; installs to home screen / standalone.
- **Push reminders** — per-device opt-in on `/profile`, `push_subscriptions`, Vercel crons → `/api/reminders` (morning nudge + evening streak warning). Service worker (`public/sw.js`) handles **push display only** — no offline caching.

---
Reasonable next pick if picking just one: **weekly recap card** — low-effort, high shareability for the group chat — or **offline check-in queue** if gym connectivity is the real pain.
