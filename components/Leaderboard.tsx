import { Crown } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { RankBadge } from '@/components/RankBadge'
import { StreakFlame } from '@/components/StreakFlame'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

/** Medal styles for ranks 2 and 3 (rank 1 uses ChampionCard). Index 0 unused. */
const MEDAL_STYLES = [
  'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40',
  'bg-slate-300/15 text-slate-200 ring-1 ring-slate-300/40',
  'bg-orange-600/15 text-orange-400 ring-1 ring-orange-600/40',
]

function Position({ rank }: { rank: number }) {
  if (rank >= 2 && rank <= 3) {
    return (
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold',
          MEDAL_STYLES[rank - 1]
        )}
      >
        {rank}
      </span>
    )
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center text-sm font-medium text-muted-foreground">
      {rank}
    </span>
  )
}

function ChampionCard({ profile, isYou }: { profile: Profile; isYou: boolean }) {
  const name = profile.name ?? profile.display_name

  return (
    <article
      className="champion-card relative overflow-hidden rounded-2xl border border-amber-400/35 bg-card p-4 sm:p-5"
      aria-label={`Leading hunter: ${name}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.78_0.12_85_/0.16),transparent_65%)]"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/45 sm:size-16">
            <Crown className="champion-crown size-5 text-amber-300 sm:size-6" strokeWidth={2.25} aria-hidden />
            <span className="font-heading text-lg font-bold leading-none text-amber-200 sm:text-xl">1</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-amber-200/80 uppercase">
              Leading hunter
            </p>
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate font-heading text-lg font-semibold tracking-wide sm:text-xl">{name}</h2>
              {isYou && (
                <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary">
                  YOU
                </span>
              )}
            </div>
            <RankBadge rank={profile.rank} level={profile.level} />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 pl-[4.25rem] sm:flex-col sm:items-end sm:pl-0">
          <div className="flex flex-col sm:items-end">
            <span className="font-display-num text-2xl font-bold tabular-nums text-amber-100 sm:text-3xl">
              {profile.total_xp}
            </span>
            <span className="text-xs text-muted-foreground">XP</span>
          </div>
          <StreakFlame streak={profile.current_streak} />
        </div>
      </div>
    </article>
  )
}

export function Leaderboard({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  if (profiles.length === 0) {
    return (
      <p className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        No hunters on the board yet.
      </p>
    )
  }

  const champion = profiles[0]!
  const rest = profiles.slice(1)

  return (
    <div className="flex flex-col gap-4">
      <ChampionCard profile={champion} isYou={champion.id === currentUserId} />

      {rest.length > 0 && (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-2 sm:hidden">
            {rest.map((profile, index) => {
              const rank = index + 2
              const isYou = profile.id === currentUserId
              return (
                <div
                  key={profile.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3',
                    isYou ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                  )}
                >
                  <Position rank={rank} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{profile.name ?? profile.display_name}</span>
                      {isYou && (
                        <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary">
                          YOU
                        </span>
                      )}
                    </div>
                    <RankBadge rank={profile.rank} level={profile.level} />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-display-num text-sm font-semibold tabular-nums">{profile.total_xp} XP</span>
                    <StreakFlame streak={profile.current_streak} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Hunter</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rest.map((profile, index) => {
                  const rank = index + 2
                  return (
                    <TableRow
                      key={profile.id}
                      className={profile.id === currentUserId ? 'bg-primary/5' : undefined}
                    >
                      <TableCell>
                        <Position rank={rank} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {profile.name ?? profile.display_name}
                        {profile.id === currentUserId && (
                          <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary">
                            YOU
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RankBadge rank={profile.rank} level={profile.level} />
                      </TableCell>
                      <TableCell className="font-display-num tabular-nums">{profile.total_xp}</TableCell>
                      <TableCell>
                        <StreakFlame streak={profile.current_streak} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
