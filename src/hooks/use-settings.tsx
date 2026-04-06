'use client'

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import type {
  UserSettings,
  CloudSyncState,
  SettingsContextValue,
  AccentColor,
} from '@/lib/settings-types'
import { DEFAULT_SETTINGS, DEFAULT_SYNC_STATE, ACCENT_COLORS } from '@/lib/settings-types'

const SETTINGS_STORAGE_KEY = 'on-deck-settings'

const SettingsContext = createContext<SettingsContextValue | null>(null)

function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
  if (!stored) return DEFAULT_SETTINGS
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

function applyAccentColor(accentColor: AccentColor): void {
  if (typeof window === 'undefined') return
  const accent = ACCENT_COLORS.find((c) => c.id === accentColor)
  if (!accent) return
  
  const root = document.documentElement
  root.style.setProperty('--primary', `oklch(0.7 0.15 ${accent.hue})`)
  root.style.setProperty('--accent', `oklch(0.7 0.15 ${accent.hue})`)
  root.style.setProperty('--ring', `oklch(0.7 0.15 ${accent.hue})`)
  root.style.setProperty('--sidebar-primary', `oklch(0.7 0.15 ${accent.hue})`)
  root.style.setProperty('--sidebar-ring', `oklch(0.7 0.15 ${accent.hue})`)
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [syncState, setSyncState] = useState<CloudSyncState>(DEFAULT_SYNC_STATE)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
    applyAccentColor(loaded.accentColor)
    setTheme(loaded.theme)
    setIsLoaded(true)
  }, [setTheme])

  // Save settings when they change
  useEffect(() => {
    if (isLoaded) {
      saveSettings(settings)
      applyAccentColor(settings.accentColor)
    }
  }, [settings, isLoaded])

  const updateSettings = useCallback(
    (updates: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates }
        if (updates.theme) {
          setTheme(updates.theme)
        }
        return next
      })
    },
    [setTheme]
  )

  const triggerSync = useCallback(async () => {
    if (!syncState.isAuthenticated) return
    
    setSyncState((prev) => ({ ...prev, status: 'syncing' }))
    
    // Simulate sync delay - replace with actual backend call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setSyncState((prev) => ({
      ...prev,
      status: 'synced',
      lastSynced: Date.now(),
    }))
  }, [syncState.isAuthenticated])

  const signIn = useCallback(() => {
    // This would open the auth modal - for now we mock the state
    setSyncState({
      status: 'synced',
      lastSynced: Date.now(),
      isAuthenticated: true,
      userEmail: 'user@example.com',
    })
  }, [])

  const signOut = useCallback(() => {
    setSyncState(DEFAULT_SYNC_STATE)
  }, [])

  const cloudSync = {
    isConnected: syncState.isAuthenticated,
    status: syncState.status,
    lastSynced: syncState.lastSynced,
    user: syncState.userEmail ? { email: syncState.userEmail } : null,
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        syncState,
        cloudSync,
        updateSettings,
        triggerSync,
        signIn,
        signOut,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
