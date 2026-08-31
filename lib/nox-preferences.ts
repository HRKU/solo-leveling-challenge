'use client'

import { useMemo, useSyncExternalStore } from 'react'

export type NoxMotion = 'full' | 'reduced' | 'off'

export type NoxPreferences = {
  visible: boolean
  tips: boolean
  motion: NoxMotion
}

const STORAGE_KEY = 'sl:nox-preferences'
const CHANGE_EVENT = 'sl:nox-preferences-change'

export const DEFAULT_NOX_PREFERENCES: NoxPreferences = {
  visible: true,
  tips: true,
  motion: 'full',
}

const DEFAULT_SNAPSHOT = JSON.stringify(DEFAULT_NOX_PREFERENCES)

function normalize(value: unknown): NoxPreferences {
  if (!value || typeof value !== 'object') return DEFAULT_NOX_PREFERENCES
  const candidate = value as Partial<NoxPreferences>
  return {
    visible: candidate.visible !== false,
    tips: candidate.tips !== false,
    motion: candidate.motion === 'off' || candidate.motion === 'reduced' ? candidate.motion : 'full',
  }
}

function getSnapshot(): string {
  try {
    return JSON.stringify(normalize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')))
  } catch {
    return DEFAULT_SNAPSHOT
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
  }
}

export function setNoxPreferences(preferences: NoxPreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(preferences)))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useNoxPreferences(): NoxPreferences {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SNAPSHOT)
  return useMemo(() => normalize(JSON.parse(snapshot)), [snapshot])
}
