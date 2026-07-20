export type LoggingMode =
  | 'bodyweight_reps'
  | 'weighted_reps'
  | 'duration'
  | 'weighted_duration'

export type ExerciseCategory =
  | 'push'
  | 'pull'
  | 'legs'
  | 'arms'
  | 'core'
  | 'hold'
  | 'cardio'

export interface CatalogExercise {
  id: string
  name: string
  category: ExerciseCategory
  loggingMode: LoggingMode
  /** Future XP tier — display-only in Phase 1 */
  difficulty: number
  sort: number
}

export const EXERCISE_CATEGORIES: { id: ExerciseCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
  { id: 'hold', label: 'Hold' },
  { id: 'cardio', label: 'Cardio' },
]

/** Curated seed library — Phase 1 is code-only (no DB). */
export const EXERCISE_CATALOG: CatalogExercise[] = [
  // Push
  { id: 'pushups', name: 'Push-ups', category: 'push', loggingMode: 'bodyweight_reps', difficulty: 1, sort: 10 },
  { id: 'diamond-pushups', name: 'Diamond push-ups', category: 'push', loggingMode: 'bodyweight_reps', difficulty: 1.2, sort: 11 },
  { id: 'decline-pushups', name: 'Decline push-ups', category: 'push', loggingMode: 'bodyweight_reps', difficulty: 1.15, sort: 12 },
  { id: 'dumbbell-chest-press', name: 'Dumbbell chest press', category: 'push', loggingMode: 'weighted_reps', difficulty: 1, sort: 13 },
  { id: 'barbell-bench-press', name: 'Barbell bench press', category: 'push', loggingMode: 'weighted_reps', difficulty: 1.1, sort: 14 },
  { id: 'overhead-press', name: 'Overhead press', category: 'push', loggingMode: 'weighted_reps', difficulty: 1.1, sort: 15 },
  { id: 'dips', name: 'Dips', category: 'push', loggingMode: 'bodyweight_reps', difficulty: 1.3, sort: 16 },

  // Pull
  { id: 'pullups', name: 'Pull-ups', category: 'pull', loggingMode: 'bodyweight_reps', difficulty: 2, sort: 20 },
  { id: 'chinups', name: 'Chin-ups', category: 'pull', loggingMode: 'bodyweight_reps', difficulty: 1.9, sort: 21 },
  { id: 'lat-pulldown', name: 'Lat pulldown', category: 'pull', loggingMode: 'weighted_reps', difficulty: 1, sort: 22 },
  { id: 'barbell-row', name: 'Barbell row', category: 'pull', loggingMode: 'weighted_reps', difficulty: 1.1, sort: 23 },
  { id: 'dumbbell-row', name: 'Dumbbell row', category: 'pull', loggingMode: 'weighted_reps', difficulty: 1, sort: 24 },
  { id: 'deadlift', name: 'Deadlift', category: 'pull', loggingMode: 'weighted_reps', difficulty: 1.4, sort: 25 },
  { id: 'dead-hang', name: 'Dead hang', category: 'hold', loggingMode: 'duration', difficulty: 0.12, sort: 26 },

  // Legs
  { id: 'squats', name: 'Squats', category: 'legs', loggingMode: 'bodyweight_reps', difficulty: 1, sort: 30 },
  { id: 'goblet-squats', name: 'Goblet squats', category: 'legs', loggingMode: 'weighted_reps', difficulty: 1.05, sort: 31 },
  { id: 'barbell-back-squat', name: 'Barbell back squat', category: 'legs', loggingMode: 'weighted_reps', difficulty: 1.2, sort: 32 },
  { id: 'lunges', name: 'Lunges', category: 'legs', loggingMode: 'bodyweight_reps', difficulty: 0.9, sort: 33 },
  { id: 'walking-lunges', name: 'Walking lunges', category: 'legs', loggingMode: 'bodyweight_reps', difficulty: 0.95, sort: 34 },
  { id: 'romanian-deadlift', name: 'Romanian deadlift', category: 'legs', loggingMode: 'weighted_reps', difficulty: 1.15, sort: 35 },
  { id: 'leg-press', name: 'Leg press', category: 'legs', loggingMode: 'weighted_reps', difficulty: 0.9, sort: 36 },
  { id: 'calf-raises', name: 'Calf raises', category: 'legs', loggingMode: 'bodyweight_reps', difficulty: 0.4, sort: 37 },

  // Arms
  { id: 'barbell-curls', name: 'Barbell curls', category: 'arms', loggingMode: 'weighted_reps', difficulty: 0.7, sort: 40 },
  { id: 'dumbbell-curls', name: 'Dumbbell curls', category: 'arms', loggingMode: 'weighted_reps', difficulty: 0.7, sort: 41 },
  { id: 'hammer-curls', name: 'Hammer curls', category: 'arms', loggingMode: 'weighted_reps', difficulty: 0.7, sort: 42 },
  { id: 'triceps-extensions', name: 'Triceps extensions', category: 'arms', loggingMode: 'weighted_reps', difficulty: 0.65, sort: 43 },
  { id: 'skull-crushers', name: 'Skull crushers', category: 'arms', loggingMode: 'weighted_reps', difficulty: 0.7, sort: 44 },

  // Core
  { id: 'crunches', name: 'Crunches', category: 'core', loggingMode: 'bodyweight_reps', difficulty: 0.5, sort: 50 },
  { id: 'leg-raises', name: 'Leg raises', category: 'core', loggingMode: 'bodyweight_reps', difficulty: 0.75, sort: 51 },
  { id: 'hanging-leg-raises', name: 'Hanging leg raises', category: 'core', loggingMode: 'bodyweight_reps', difficulty: 1.1, sort: 52 },
  { id: 'russian-twists', name: 'Russian twists', category: 'core', loggingMode: 'bodyweight_reps', difficulty: 0.55, sort: 53 },
  { id: 'plank', name: 'Plank', category: 'hold', loggingMode: 'duration', difficulty: 0.1, sort: 54 },
  { id: 'elbow-plank', name: 'Elbow plank', category: 'hold', loggingMode: 'duration', difficulty: 0.1, sort: 55 },
  { id: 'side-plank', name: 'Side plank', category: 'hold', loggingMode: 'duration', difficulty: 0.11, sort: 56 },

  // Cardio / misc
  { id: 'burpees', name: 'Burpees', category: 'cardio', loggingMode: 'bodyweight_reps', difficulty: 1.2, sort: 60 },
  { id: 'jumping-jacks', name: 'Jumping jacks', category: 'cardio', loggingMode: 'bodyweight_reps', difficulty: 0.3, sort: 61 },
  { id: 'mountain-climbers', name: 'Mountain climbers', category: 'cardio', loggingMode: 'bodyweight_reps', difficulty: 0.45, sort: 62 },
  { id: 'farmer-carry', name: 'Farmer carry', category: 'hold', loggingMode: 'weighted_duration', difficulty: 0.15, sort: 63 },
]

export function getExerciseById(id: string): CatalogExercise | undefined {
  return EXERCISE_CATALOG.find((e) => e.id === id)
}

export function searchExercises(
  query: string,
  category: ExerciseCategory | 'all'
): CatalogExercise[] {
  const q = query.trim().toLowerCase()
  return EXERCISE_CATALOG.filter((e) => {
    if (category !== 'all' && e.category !== category) return false
    // Empty query = browse by category (not a text search).
    if (!q) return true
    return e.name.toLowerCase().includes(q)
  }).sort((a, b) => a.sort - b.sort)
}

export function loggingModeLabel(mode: LoggingMode): string {
  switch (mode) {
    case 'bodyweight_reps':
      return 'sets · reps'
    case 'weighted_reps':
      return 'sets · reps · weight'
    case 'duration':
      return 'sets · duration'
    case 'weighted_duration':
      return 'sets · duration · weight'
  }
}
