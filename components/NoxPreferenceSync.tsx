'use client'

import { useEffect } from 'react'
import { useNoxPreferences } from '@/lib/nox-preferences'

export function NoxPreferenceSync() {
  const preferences = useNoxPreferences()

  useEffect(() => {
    const root = document.documentElement
    root.dataset.noxVisible = String(preferences.visible)
    root.dataset.noxTips = String(preferences.tips)
    root.dataset.noxMotion = preferences.motion
  }, [preferences])

  return null
}
