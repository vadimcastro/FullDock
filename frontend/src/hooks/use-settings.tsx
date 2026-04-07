'use client'

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useRef,
  type ReactNode 
} from 'react'
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

function applyFontScale(fontScale: number): void {
  if (typeof window === 'undefined') return
  const clamped = Math.max(85, Math.min(120, Math.round(fontScale)))
  document.documentElement.style.fontSize = `${clamped}%`
}

const mapToBackend = (s: Partial<UserSettings>) => {
  const mapped: any = {}
  if (s.theme !== undefined) mapped.theme = s.theme
  if (s.accentColor !== undefined) mapped.accent_color = s.accentColor
  if (s.notifications !== undefined) mapped.notifications = s.notifications
  if (s.soundEnabled !== undefined) mapped.sound_enabled = s.soundEnabled
  if (s.autoSave !== undefined) mapped.auto_save = s.autoSave
  if (s.fontScale !== undefined) mapped.font_scale = s.fontScale
  if (s.showPromptTitles !== undefined) mapped.show_prompt_titles = s.showPromptTitles
  return mapped
}

const mapFromBackend = (data: any): UserSettings => ({
  theme: data.theme || 'dark',
  accentColor: data.accent_color || 'teal',
  notifications: data.notifications ?? false,
  soundEnabled: data.sound_enabled ?? false,
  autoSave: data.auto_save ?? true,
  fontScale: data.font_scale ?? 100,
  showPromptTitles: data.show_prompt_titles ?? true,
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [syncState, setSyncState] = useState<CloudSyncState>(DEFAULT_SYNC_STATE)
  const { setTheme } = useTheme()
  const { isAuthenticated, login, register, logout, user } = useAuth()
  const api = useProtectedApi()
  const syncInProgress = useRef(false)

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const local = localStorage.getItem('ondeck-settings')
    if (local) {
      try {
        const parsed = JSON.parse(local)
        setSettings(parsed)
      } catch (e) {
        console.error('Failed to parse local settings:', e)
      }
    }
  }, [])

  // Apply theme/accent from the current settings state.
  useEffect(() => {
    setTheme(settings.theme)
    applyAccentColor(settings.accentColor)
    applyFontScale(settings.fontScale ?? 100)
  }, [settings.theme, settings.accentColor, settings.fontScale, setTheme])

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await api.get<any>('/api/v1/settings/')
      if (data) {
        const mapped = mapFromBackend(data)
        setSettings(mapped)
        setSyncState((prev: CloudSyncState) => ({ ...prev, lastSynced: Date.now(), status: 'synced' }))
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'error' }))
    }
  }, [api, isAuthenticated])

  // Keep cloud sync auth state derived from the single source of truth (AuthContext).
  useEffect(() => {
    setSyncState((prev: CloudSyncState) => {
      if (!isAuthenticated) {
        return DEFAULT_SYNC_STATE
      }

      return {
        ...prev,
        isAuthenticated: true,
        userEmail: user?.email ?? null,
        status: prev.status === 'offline' ? 'synced' : prev.status,
      }
    })
  }, [isAuthenticated, user?.email])

  // 2. Sync Local to Cloud on Login
  useEffect(() => {
    const syncLocalToCloud = async () => {
      if (isAuthenticated && !syncInProgress.current) {
        syncInProgress.current = true
        try {
          await api.post('/api/v1/settings/', mapToBackend(settings))
        } catch (e) {
          console.error('Failed to sync local settings:', e)
        } finally {
          syncInProgress.current = false
          fetchSettings()
        }
      }
    }
    syncLocalToCloud()
  }, [isAuthenticated, api, fetchSettings])

  // 3. Persist to LocalStorage whenever settings change (if not syncing)
  useEffect(() => {
    if (!syncInProgress.current) {
      localStorage.setItem('ondeck-settings', JSON.stringify(settings))
    }
  }, [settings])

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      setSettings((prev: UserSettings) => ({ ...prev, ...updates }))

      if (isAuthenticated) {
        try {
          await api.post('/api/v1/settings/', mapToBackend(updates))
          setSyncState((prev: CloudSyncState) => ({ ...prev, lastSynced: Date.now(), status: 'synced' }))
        } catch (error) {
          console.error('Failed to sync settings:', error)
          setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'error' }))
        }
      }
    },
    [api, isAuthenticated]
  )

  const triggerSync = useCallback(async () => {
    if (!isAuthenticated) return
    setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'syncing' }))
    await fetchSettings()
  }, [isAuthenticated, fetchSettings])

  const signIn = useCallback(async (email: string, password: string) => {
    await login(email, password)
  }, [login])

  const signUp = useCallback(async (email: string, password: string) => {
    await register(email, password)
    try {
      await api.post('/api/v1/settings/', mapToBackend(settings))
    } catch (e) {
      console.error('Failed to sync initial settings on signup:', e)
    }
  }, [register, api, settings])

  const signOut = useCallback(() => {
    logout()
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('ondeck-settings')
    setSyncState(DEFAULT_SYNC_STATE)
  }, [logout])

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
        signUp,
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
