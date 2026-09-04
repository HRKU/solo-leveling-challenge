'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export interface AuthFormState {
  error?: string
  success?: string
}

const emailSchema = z.email('Enter a valid email address.')

function parseEmail(formData: FormData): { email?: string; error?: string } {
  const result = emailSchema.safeParse(String(formData.get('email') ?? '').trim())
  return result.success ? { email: result.data } : { error: result.error.issues[0]?.message }
}

function inviteCodesMatch(submittedCode: string, expectedCode: string): boolean {
  const submittedHash = createHash('sha256').update(submittedCode).digest()
  const expectedHash = createHash('sha256').update(expectedCode).digest()
  return timingSafeEqual(submittedHash, expectedHash)
}

export async function signUp(_prevState: AuthFormState | undefined, formData: FormData) {
  const parsedEmail = parseEmail(formData)
  const password = formData.get('password') as string
  const displayName = (formData.get('displayName') as string)?.trim()
  const inviteCode = (formData.get('inviteCode') as string)?.trim()

  if (!parsedEmail.email || !password || !displayName || !inviteCode) {
    return { error: parsedEmail.error ?? 'All fields are required.' }
  }
  const email = parsedEmail.email
  if (displayName.length < 2 || displayName.length > 40) {
    return { error: 'Display name must be between 2 and 40 characters.' }
  }
  if (inviteCode.length > 200) {
    return { error: 'Invalid invite code.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const expectedInviteCode = process.env.GROUP_INVITE_CODE
  if (!expectedInviteCode) {
    return { error: 'Signup is temporarily unavailable.' }
  }
  if (!inviteCodesMatch(inviteCode, expectedInviteCode)) {
    return { error: 'Invalid invite code.' }
  }

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
    app_metadata: { onboarded: false },
  })

  if (createError || !created.user) {
    return { error: 'Unable to create account. Check your details or log in instead.' }
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: 'Unable to start your session. Please try again.' }
  }

  redirect('/onboarding')
}

export async function signIn(_prevState: AuthFormState | undefined, formData: FormData) {
  const parsedEmail = parseEmail(formData)
  const password = formData.get('password') as string

  if (!parsedEmail.email || !password) {
    return { error: parsedEmail.error ?? 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email: parsedEmail.email, password })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  redirect('/awakening')
}

export async function requestPasswordReset(
  _prevState: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const parsedEmail = parseEmail(formData)
  if (!parsedEmail.email) {
    return { error: parsedEmail.error ?? 'Enter your email address.' }
  }

  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL
  if (!origin) {
    return { error: 'Password reset is temporarily unavailable.' }
  }

  const redirectUrl = new URL('/auth/callback', origin)
  redirectUrl.searchParams.set('next', '/update-password')

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.email, {
    redirectTo: redirectUrl.toString(),
  })

  if (error) {
    return { error: 'Unable to send a reset email right now. Please try again shortly.' }
  }

  // Keep this generic so the response never reveals whether an account exists.
  return { success: 'If that email belongs to a Hunter, a reset link is on its way.' }
}

export async function updatePassword(
  _prevState: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const cookieStore = await cookies()
  if (cookieStore.get('sl-password-recovery')?.value !== '1') {
    return { error: 'This reset link is invalid or has expired. Request a new one.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'This reset link is invalid or has expired. Request a new one.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: 'Unable to update your password. Request a new reset link and try again.' }
  }

  cookieStore.delete('sl-password-recovery')
  await supabase.auth.signOut()
  redirect('/login?reset=success')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
