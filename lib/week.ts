/** UTC Monday (ISO date) for the week containing `date` (defaults to now). */
export function currentWeekStartDate(date: Date = new Date()): string {
  const day = date.getUTCDay() // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setUTCDate(date.getUTCDate() + diffToMonday)
  return monday.toISOString().slice(0, 10)
}

/** Short label for a week-start ISO date, e.g. "Jul 14". */
export function formatWeekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
