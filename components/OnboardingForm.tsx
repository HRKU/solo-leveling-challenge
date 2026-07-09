'use client'

import { useActionState } from 'react'
import { completeOnboarding } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboarding, undefined)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Set up your Hunter profile</CardTitle>
        <CardDescription>
          This drives your personalized daily targets — no guessing, no fake defaults.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Your name" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" min={1} max={129} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sex">Sex</Label>
              <Select name="sex" defaultValue="other">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input id="heightCm" name="heightCm" type="number" min={1} step="0.1" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startingWeightKg">Current weight (kg)</Label>
              <Input id="startingWeightKg" name="startingWeightKg" type="number" min={1} step="0.1" required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goalType">Goal</Label>
            <Select name="goalType" defaultValue="maintain">
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
            <Label htmlFor="targetWeightKg">Target weight (kg) — optional</Label>
            <Input id="targetWeightKg" name="targetWeightKg" type="number" min={1} step="0.1" />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Saving...' : 'Start the challenge'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
