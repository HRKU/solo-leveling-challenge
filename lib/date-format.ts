/**
 * Human-readable formatting + Date<->ISO helpers for check-in dates.
 *
 * Check-in dates are plain calendar days (`yyyy-MM-dd`, no time component —
 * see `daily_checkins.checkin_date`). We deliberately avoid `Date#toISOString`
 * / UTC parsing here: these helpers treat the string's Y/M/D as a local
 * calendar date so a date picked in the UI always round-trips to the same
 * label, regardless of the viewer's timezone offset.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parses a `yyyy-MM-dd` string into a local `Date` at midnight. */
export function isoToLocalDate(isoDate: string): Date {
  const match = ISO_DATE_RE.exec(isoDate)
  if (!match) return new Date(NaN)
  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

/** Formats a local `Date` back to `yyyy-MM-dd`. */
export function localDateToIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today as `yyyy-MM-dd`, from the viewer's local clock. */
export function todayIsoDate(): string {
  return localDateToIso(new Date())
}

/** Yesterday as `yyyy-MM-dd`, from the viewer's local clock. */
export function yesterdayIsoDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localDateToIso(d)
}

function formatParts(
  isoDate: string,
  weekday: 'long' | 'short',
  month: 'long' | 'short',
  yearMode: 'auto' | 'always' = 'auto'
): string {
  const d = isoToLocalDate(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  const weekdayLabel = d.toLocaleDateString('en-US', { weekday })
  const monthLabel = d.toLocaleDateString('en-US', { month })
  const day = d.getDate()
  const year = d.getFullYear()
  const currentYear = new Date().getFullYear()
  const base = `${weekdayLabel}, ${day} ${monthLabel}`
  const showYear = yearMode === 'always' || year !== currentYear
  return showYear ? `${base} ${year}` : base
}

/** "Monday, 7 July" — appends the year only when it isn't the current year. */
export function formatCheckinDateHeading(isoDate: string): string {
  return formatParts(isoDate, 'long', 'long')
}

/** "Mon, 7 Jul" — compact form for buttons/chips. */
export function formatCheckinDateShort(isoDate: string): string {
  return formatParts(isoDate, 'short', 'short')
}

/** "Monday, 20 July 2026" — always includes the year (reviewing history spans years). */
export function formatFullCheckinDate(isoDate: string): string {
  return formatParts(isoDate, 'long', 'long', 'always')
}
