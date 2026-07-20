'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Ruler, Target, Flag } from 'lucide-react'
import type { Profile } from '@/lib/types'

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined)

  useEffect(() => {
    if (state?.success) toast.success('Profile updated.')
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Edit your Hunter profile</CardTitle>
        <CardDescription>Changes apply to your personalized daily targets immediately.</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={profile.name ?? ''} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" min={1} max={129} defaultValue={profile.age ?? ''} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sex">Sex</Label>
              <Select name="sex" defaultValue={profile.sex ?? 'other'}>
                <SelectTrigger id="sex" className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="heightCm" className="flex items-center gap-1.5">
              <Ruler className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
              Height (cm)
            </Label>
            <Input
              id="heightCm"
              name="heightCm"
              type="number"
              inputMode="decimal"
              min={1}
              step="0.1"
              defaultValue={profile.height_cm ?? ''}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goalType" className="flex items-center gap-1.5">
              <Target className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
              Goal
            </Label>
            <Select name="goalType" defaultValue={profile.goal_type ?? 'maintain'}>
              <SelectTrigger id="goalType" className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lose">Lose weight</SelectItem>
                <SelectItem value="gain">Gain weight</SelectItem>
                <SelectItem value="maintain">Maintain weight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="targetWeightKg" className="flex items-center gap-1.5">
              <Flag className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
              Target weight (kg) — optional
            </Label>
            <Input
              id="targetWeightKg"
              name="targetWeightKg"
              type="number"
              inputMode="decimal"
              min={1}
              step="0.1"
              defaultValue={profile.target_weight_kg ?? ''}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Current weight ({profile.current_weight_kg ?? '—'} kg) is updated via your weekly check-in, not here.
          </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending ? 'Saving...' : 'Save changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
