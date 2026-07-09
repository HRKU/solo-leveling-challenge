import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { RankBadge } from '@/components/RankBadge'
import { StreakFlame } from '@/components/StreakFlame'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const MEDAL_STYLES = [
  'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40',
  'bg-slate-300/15 text-slate-200 ring-1 ring-slate-300/40',
  'bg-orange-600/15 text-orange-400 ring-1 ring-orange-600/40',
]

function Position({ index }: { index: number }) {
  if (index < 3) {
    return (
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold',
          MEDAL_STYLES[index]
        )}
      >
        {index + 1}
      </span>
    )
  }
  return <span className="flex size-7 shrink-0 items-center justify-center text-sm font-medium text-muted-foreground">{index + 1}</span>
}

export function Leaderboard({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  return (
    <>
      {/* Mobile: card list */}
      <div className="flex flex-col gap-2 sm:hidden">
        {profiles.map((profile, index) => {
          const isYou = profile.id === currentUserId
          return (
            <div
              key={profile.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3',
                isYou ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
              )}
            >
              <Position index={index} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{profile.name ?? profile.display_name}</span>
                  {isYou && <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary">YOU</span>}
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
            {profiles.map((profile, index) => (
              <TableRow key={profile.id} className={profile.id === currentUserId ? 'bg-primary/5' : undefined}>
                <TableCell>
                  <Position index={index} />
                </TableCell>
                <TableCell className="font-medium">
                  {profile.name ?? profile.display_name}
                  {profile.id === currentUserId && (
                    <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary">YOU</span>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
