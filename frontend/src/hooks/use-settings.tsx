'use client'

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import type {
  UserSettings,
  CloudSyncState,
  SettingsContextValue,
} from '@/lib/settings-types'
import { DEFAULT_SETTINGS, DEFAULT_SYNC_STATE, ACCENT_COLORS } from '@/lib/settings-types'
import { useProtectedApi } from '@/lib/api/protected'
import { useAuth } from '@/lib/auth/AuthContext'

const SettingsContext = createContext<SettingsContextValue | null>(null)

function applyAccentColor(accentColor: string): void {
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
  const { user, isAuthenticated } = useAuth()
  const api = useProtectedApi()
  
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [syncState, setSyncState] = useState<CloudSyncState>(DEFAULT_SYNC_STATE)
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoaded(true)
      return
    }
    try {
      const data = await api.get<UserSettings>('/api/v1/settings/')
      setSettings(data)
      applyAccentColor(data.accentColor)
      setTheme(data.theme)
      setSyncState({
        status: 'synced',
        lastSynced: Date.now(),
        isAuthenticated: true,
        userEmail: user?.email || null,
      })
      setIsLoaded(true)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setIsLoaded(true)
    }
  }, [api, isAuthenticated, user, setTheme])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates }
        if (updates.theme) {
          setTheme(updates.theme)
        }
        if (updates.accentColor) {
          applyAccentColor(updates.accentColor)
        }
        return next
      })

      if (isAuthenticated) {
        try {
          await api.post('/api/v1/settings/', updates)
          setSyncState(prev => ({ ...prev, lastSynced: Date.now(), status: 'synced' }))
        } catch (error) {
          console.error('Failed to sync settings:', error)
          setSyncState(prev => ({ ...prev, status: 'error' }))
        }
      }
    },
    [setTheme, api, isAuthenticated]
  )

  const triggerSync = useCallback(async () => {
    if (!isAuthenticated) return
    setSyncState((prev) => ({ ...prev, status: 'syncing' }))
    await fetchSettings()
  }, [isAuthenticated, fetchSettings])

  const signIn = useCallback(() => {
    // Rely on FullDock's auth flow
    window.location.href = '/login'
  }, [])

  const signOut = useCallback(() => {
    // Rely on FullDock's auth flow
    window.location.href = '/logout'
  }, [])

  const cloudSync = {
    isConnected: isAuthenticated,
    status: syncState.status,
    lastSynced: syncState.lastSynced,
    user: user ? { email: user.email } : null,
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
