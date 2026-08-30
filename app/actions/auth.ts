'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHash, timingSafeEqual } from 'node:crypto'
import { redirect } from 'next/navigation'

export interface AuthFormState {
  error?: string
}

function inviteCodesMatch(submittedCode: string, expectedCode: string): boolean {
  const submittedHash = createHash('sha256').update(submittedCode).digest()
  const expectedHash = createHash('sha256').update(expectedCode).digest()
  return timingSafeEqual(submittedHash, expectedHash)
}

export async function signUp(_prevState: AuthFormState | undefined, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const displayName = (formData.get('displayName') as string)?.trim()
  const inviteCode = (formData.get('inviteCode') as string)?.trim()

  if (!email || !password || !displayName || !inviteCode) {
    return { error: 'All fields are required.' }
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
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
