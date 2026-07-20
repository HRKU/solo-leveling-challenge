import { z } from 'zod'
import { getExerciseById } from '@/lib/exercise-catalog'

/** Shared numeric / text limits — client preview + server trust boundary. */
export const CHECKIN_LIMITS = {
  searchQueryMax: 80,
  notesMax: 2000,
  waterMlMax: 20_000,
  stepsMax: 200_000,
  proteinGMax: 1_000,
  caloriesMax: 20_000,
  sleepHoursMax: 24,
  repsMax: 2_000,
  durationSecMax: 10_800,
  weightMax: 1_000,
  setsPerExerciseMax: 30,
  exercisesPerDayMax: 40,
  entryNotesMax: 500,
} as const

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export function sanitizeText(value: string, max: number): string {
  return value.replace(CONTROL_CHARS, '').trim().slice(0, max)
}

export function sanitizeSearchQuery(raw: string): string {
  return sanitizeText(raw, CHECKIN_LIMITS.searchQueryMax)
}

function finiteNumber(max: number, int = false) {
  return z
    .number()
    .finite()
    .min(0)
    .max(max)
    .refine((n) => !int || Number.isInteger(n), { message: 'Must be a whole number' })
}

export const workoutSetSchema = z.object({
  id: z.string().min(1).max(64),
  reps: z.number().finite().int().min(0).max(CHECKIN_LIMITS.repsMax).nullable(),
  durationSec: z.number().finite().int().min(0).max(CHECKIN_LIMITS.durationSecMax).nullable(),
  weight: z.number().finite().min(0).max(CHECKIN_LIMITS.weightMax).nullable(),
})

export const workoutEntrySchema = z
  .object({
    id: z.string().min(1).max(64),
    exerciseId: z.string().min(1).max(64),
    weightUnit: z.enum(['kg', 'lb']),
    notes: z.string().max(CHECKIN_LIMITS.entryNotesMax),
    sets: z.array(workoutSetSchema).min(1).max(CHECKIN_LIMITS.setsPerExerciseMax),
  })
  .superRefine((entry, ctx) => {
    if (!getExerciseById(entry.exerciseId)) {
      ctx.addIssue({
        code: 'custom',
        message: `Unknown exercise: ${entry.exerciseId}`,
        path: ['exerciseId'],
      })
    }
  })
  .transform((entry) => ({
    ...entry,
    notes: sanitizeText(entry.notes, CHECKIN_LIMITS.entryNotesMax),
  }))

export const workoutEntriesSchema = z
  .array(workoutEntrySchema)
  .max(CHECKIN_LIMITS.exercisesPerDayMax)

export const dailyEssentialsSchema = z.object({
  waterMl: finiteNumber(CHECKIN_LIMITS.waterMlMax, true).nullable(),
  sleepHours: finiteNumber(CHECKIN_LIMITS.sleepHoursMax).nullable(),
  steps: finiteNumber(CHECKIN_LIMITS.stepsMax, true).nullable(),
  proteinG: finiteNumber(CHECKIN_LIMITS.proteinGMax, true).nullable(),
  calories: finiteNumber(CHECKIN_LIMITS.caloriesMax, true).nullable(),
  notes: z.string().max(CHECKIN_LIMITS.notesMax).nullable(),
})

export const dailyCheckinPayloadSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
    .optional(),
  waterMl: finiteNumber(CHECKIN_LIMITS.waterMlMax, true).nullable(),
  sleepHours: finiteNumber(CHECKIN_LIMITS.sleepHoursMax).nullable(),
  steps: finiteNumber(CHECKIN_LIMITS.stepsMax, true).nullable(),
  proteinG: finiteNumber(CHECKIN_LIMITS.proteinGMax, true).nullable(),
  calories: finiteNumber(CHECKIN_LIMITS.caloriesMax, true).nullable(),
  notes: z.string().max(CHECKIN_LIMITS.notesMax).nullable(),
  workoutEntries: workoutEntriesSchema,
})

export type DailyCheckinPayload = z.infer<typeof dailyCheckinPayloadSchema>

function parseOptionalNumber(raw: FormDataEntryValue | null, int = false): number | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw))
  if (!Number.isFinite(n)) return Number.NaN
  return int ? Math.trunc(n) : n
}

/** Parse FormData then validate at the trust boundary. */
export function parseDailyCheckinFormData(formData: FormData): {
  success: true
  data: DailyCheckinPayload
} | {
  success: false
  error: string
} {
  let workoutEntries: unknown = []
  const rawWorkout = formData.get('workoutEntries')
  if (typeof rawWorkout === 'string' && rawWorkout.trim()) {
    try {
      workoutEntries = JSON.parse(rawWorkout)
    } catch {
      return { success: false, error: 'Invalid workout data.' }
    }
  }

  const notesRaw = formData.get('notes')
  const notes =
    typeof notesRaw === 'string' && notesRaw.trim()
      ? sanitizeText(notesRaw, CHECKIN_LIMITS.notesMax)
      : null

  const candidate = {
    date: (formData.get('date') as string) || undefined,
    waterMl: parseOptionalNumber(formData.get('waterMl'), true),
    sleepHours: parseOptionalNumber(formData.get('sleepHours')),
    steps: parseOptionalNumber(formData.get('steps'), true),
    proteinG: parseOptionalNumber(formData.get('proteinG'), true),
    calories: parseOptionalNumber(formData.get('calories'), true),
    notes,
    workoutEntries,
  }

  const parsed = dailyCheckinPayloadSchema.safeParse(candidate)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Invalid check-in data.' }
  }

  return { success: true, data: parsed.data }
}
