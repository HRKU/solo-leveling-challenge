import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { RankBadge } from '@/components/RankBadge'
import { StreakFlame } from '@/components/StreakFlame'
import type { Profile } from '@/lib/types'

export function Leaderboard({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  return (
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
          <TableRow key={profile.id} className={profile.id === currentUserId ? 'bg-muted/50' : undefined}>
            <TableCell className="font-medium tabular-nums">{index + 1}</TableCell>
            <TableCell>{profile.name ?? profile.display_name}</TableCell>
            <TableCell>
              <RankBadge rank={profile.rank} level={profile.level} />
            </TableCell>
            <TableCell className="tabular-nums">{profile.total_xp}</TableCell>
            <TableCell>
              <StreakFlame streak={profile.current_streak} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
