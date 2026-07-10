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
- **Reminders** — a daily nudge (browser push, or piggyback on the group's existing chat app via a bot) since people forgetting to log is probably the biggest churn risk, bigger than any feature gap.

## Data / insight
- **Personal trends view** — best day of week, average reps over time, water/streak correlation — light analytics beyond the current weight-trend chart.
- **Wearable sync** — pull steps/workouts from Google Fit/Apple Health to auto-fill part of the daily check-in instead of manual entry.

## Infra / polish
- **Installable PWA** — add a manifest + service worker so it installs like a native app and can queue a check-in offline if signal's bad at the gym.
- **Quest photo proof (optional)** — let a quest creator require an image attached to the completion toggle instead of pure honor system, for the dares where that matters.

---
Reasonable next pick if picking just one: **weekly recap card** or **reminders** — both are low-effort and attack the actual failure mode (people forgetting to open the app) rather than adding new surface area.
