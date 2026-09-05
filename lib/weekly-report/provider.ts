import 'server-only'

import { z } from 'zod'
import type { WeeklyReportContent } from '@/lib/types'
import type { WeeklyReportPayload } from '@/lib/weekly-report/types'
import { REPORT_PROMPT_VERSION } from '@/lib/weekly-report/config'
import { selectQuestCandidates, type PersonalQuestCandidate } from '@/lib/personal-quests/selection'

export { REPORT_PROMPT_VERSION }

const REPORT_MODELS = ['openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-120b'] as const

const reportSchema = z.object({
  verdict: z.string().min(1).max(240),
  strongestProgress: z.string().min(1).max(420),
  watchPoint: z.string().min(1).max(420),
  exerciseInsight: z.string().min(1).max(420),
  bodyGoalInsight: z.string().min(1).max(420),
  selectedQuestIds: z.tuple([
    z.string().min(1).max(180),
    z.string().min(1).max(180),
    z.string().min(1).max(180),
  ]),
  noxClosing: z.string().min(1).max(240),
}).strict()

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    verdict: { type: 'string' },
    strongestProgress: { type: 'string' },
    watchPoint: { type: 'string' },
    exerciseInsight: { type: 'string' },
    bodyGoalInsight: { type: 'string' },
    selectedQuestIds: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: { type: 'string' },
    },
    noxClosing: { type: 'string' },
  },
  required: [
    'verdict', 'strongestProgress', 'watchPoint', 'exerciseInsight',
    'bodyGoalInsight', 'selectedQuestIds', 'noxClosing',
  ],
} as const

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

export interface GeneratedReport {
  content: WeeklyReportContent
  quests: PersonalQuestCandidate[]
  model: string
  inputTokens: number | null
  outputTokens: number | null
}

const SYSTEM_PROMPT = `You are Nox, a concise shadow-hunter fitness companion. Return a short JSON weekly reflection using only supplied facts. Follow these rules:
- Missing or null means "not logged", never zero.
- Do not discuss total workout or session duration. Duration is only meaningful inside duration-based exercise entries in exerciseSummary.
- State coverage when describing an average, such as "across 3 logged days".
- Use exact exercise names from exerciseSummary.
- Compare only with the personal baseline. When hasPersonalBaseline is false, call the item a "weekly win", say the baseline is still forming, and make no improvement claim.
- Choose exactly three IDs from questCandidates. Prefer the candidates most relevant to the supplied evidence while keeping the set varied. Never invent an ID.
- Prefer "met the logged target" over "100% adherence".
- Select at least one consistency or workout candidate, no more than two exercise candidates, no duplicate quest type, and no two candidates for the same exercise.
- Do not diagnose, prescribe treatment, claim safe lifting capacity, use population standards, or invent values.`

function missionTuple(quests: PersonalQuestCandidate[]): [string, string, string] {
  if (quests.length !== 3) throw new Error('REPORT_REQUIRES_THREE_QUESTS')
  return [quests[0].description, quests[1].description, quests[2].description]
}

export async function generateWithGroq(
  payload: WeeklyReportPayload,
  candidates: PersonalQuestCandidate[]
): Promise<GeneratedReport> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY_MISSING')

  const configuredModels = process.env.GROQ_REPORT_MODELS
    ?.split(',')
    .map((model) => model.trim())
    .filter(Boolean)
  const models = configuredModels?.length ? configuredModels : [...REPORT_MODELS]
  let lastFailure = 'GROQ_GENERATION_FAILED'

  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_completion_tokens: 1_000,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: JSON.stringify({
                evidence: payload,
                questCandidates: candidates.map(({ candidateId, questType, title, description, target, focus, evidence, score }) => ({ candidateId, questType, title, description, target, focus, evidence, deterministicScore: score })),
              }),
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'weekly_hunter_report', strict: true, schema: jsonSchema },
          },
        }),
        signal: AbortSignal.timeout(15_000),
      })

      if (!response.ok) {
        if (response.status === 429) {
          lastFailure = 'GROQ_RATE_LIMITED'
        } else {
          const errorBody = await response.text()
          lastFailure = errorBody.includes('json_validate_failed')
            ? 'GROQ_JSON_VALIDATE_FAILED'
            : `GROQ_HTTP_${response.status}`
        }
        continue
      }

      const result = await response.json() as GroqResponse
      const content = result.choices?.[0]?.message?.content
      if (!content) {
        lastFailure = 'GROQ_EMPTY_RESPONSE'
        continue
      }
      const parsed = reportSchema.safeParse(JSON.parse(content))
      if (!parsed.success) {
        lastFailure = 'GROQ_INVALID_REPORT'
        continue
      }
      const quests = selectQuestCandidates(candidates, parsed.data.selectedQuestIds)
      if (quests.length !== 3) {
        lastFailure = 'QUEST_CANDIDATE_SELECTION_FAILED'
        continue
      }
      const { selectedQuestIds, ...reportFields } = parsed.data
      void selectedQuestIds
      const finalContent: WeeklyReportContent = {
        ...reportFields,
        missions: missionTuple(quests),
        questCandidateIds: quests.map((quest) => quest.candidateId) as [string, string, string],
      }
      const wordCount = Object.values(finalContent)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .join(' ')
        .trim()
        .split(/\s+/).length
      if (wordCount < 80 || wordCount > 260) {
        lastFailure = 'GROQ_REPORT_LENGTH'
        continue
      }

      return {
        content: finalContent,
        quests,
        model,
        inputTokens: result.usage?.prompt_tokens ?? null,
        outputTokens: result.usage?.completion_tokens ?? null,
      }
    } catch (error) {
      lastFailure = error instanceof SyntaxError ? 'GROQ_INVALID_JSON' : 'GROQ_REQUEST_FAILED'
    }
  }

  throw new Error(lastFailure)
}

export function deterministicReport(
  payload: WeeklyReportPayload,
  candidates: PersonalQuestCandidate[] = []
): WeeklyReportContent {
  const quests = selectQuestCandidates(candidates)
  const strongest = [...payload.exerciseSummary]
    .sort((a, b) => (b.changeVsBaselinePct ?? b.totalReps + b.totalDurationSeconds) - (a.changeVsBaselinePct ?? a.totalReps + a.totalDurationSeconds))[0]
  const baselineText = payload.dataFlags.hasPersonalBaseline
    ? strongest?.changeVsBaselinePct != null
      ? `${strongest.exercise} changed ${strongest.changeVsBaselinePct > 0 ? '+' : ''}${strongest.changeVsBaselinePct}% against your recent baseline.`
      : 'Your completed work was compared with your recent eligible weeks.'
    : 'Your personal baseline is still forming, so no performance trend is claimed yet.'
  const bodyText = payload.bodyTrend.fourWeekWeightChangeKg == null
    ? 'There is not yet enough weekly weight data for a body-goal trend.'
    : `Your four-week weight change is ${payload.bodyTrend.fourWeekWeightChangeKg > 0 ? '+' : ''}${payload.bodyTrend.fourWeekWeightChangeKg} kg${payload.bodyTrend.directionMatchesGoal ? ', which currently follows your selected goal direction.' : '.'}`

  return {
    verdict: `You logged ${payload.week.workoutDays} workout days across ${payload.week.checkInDays} check-in days.`,
    strongestProgress: strongest
      ? `${strongest.exercise} led the week with ${strongest.sets} completed sets.`
      : 'You completed the minimum workout pattern needed for a weekly review.',
    watchPoint: payload.week.averageSleepHours == null
      ? 'Sleep was not logged consistently enough to connect recovery with training.'
      : `Sleep averaged ${payload.week.averageSleepHours} hours across ${payload.habitCoverage.sleepDays} logged days.`,
    exerciseInsight: baselineText,
    bodyGoalInsight: bodyText,
    missions: quests.length === 3 ? missionTuple(quests) : [
      `Log at least ${Math.max(3, payload.week.checkInDays)} days again next week.`,
      strongest ? `Repeat ${strongest.exercise} with controlled, consistent sets.` : 'Record exercise sets and repetitions clearly.',
      payload.habitCoverage.proteinDays < 3 ? 'Log protein on at least three days.' : 'Record sleep alongside each training day.',
    ],
    questCandidateIds: quests.length === 3
      ? quests.map((quest) => quest.candidateId) as [string, string, string]
      : undefined,
    noxClosing: 'Steady records reveal the path forward, Hunter.',
  }
}
