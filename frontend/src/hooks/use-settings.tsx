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
import type { PromptStatus } from '@/lib/types'
import { DEFAULT_SETTINGS, DEFAULT_SYNC_STATE, ACCENT_COLORS } from '@/lib/settings-types'
import { ProtectedApiError, useProtectedApi } from '@/lib/api/protected'
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

const parseJsonArray = <T,>(raw: unknown, fallback: T[]): T[] => {
  if (Array.isArray(raw)) return raw as T[]
  if (typeof raw !== 'string' || !raw.trim()) return fallback
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
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
  if (s.modelTabOrder !== undefined) mapped.model_tab_order = JSON.stringify(s.modelTabOrder)
  if (s.enabledModelTabs !== undefined) mapped.enabled_model_tabs = JSON.stringify(s.enabledModelTabs)
  if (s.modelTabTitles !== undefined) mapped.model_tab_titles = JSON.stringify(s.modelTabTitles)
  if (s.promptCategoryOrder !== undefined) mapped.prompt_category_order = JSON.stringify(s.promptCategoryOrder)
  if (s.enabledPromptCategories !== undefined) {
    mapped.enabled_prompt_categories = JSON.stringify(s.enabledPromptCategories)
  }
  return mapped
}

const mapFromBackend = (data: any): UserSettings => ({
  ...(() => {
    const rawOrder = parseJsonArray<string>(data.model_tab_order, DEFAULT_SETTINGS.modelTabOrder ?? [])
    const rawEnabled = parseJsonArray<string>(
      data.enabled_model_tabs,
      DEFAULT_SETTINGS.enabledModelTabs ?? []
    )
    const rawTitles =
      typeof data.model_tab_titles === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(data.model_tab_titles)
              return typeof parsed === 'object' && parsed !== null
                ? (parsed as Record<string, string>)
                : (DEFAULT_SETTINGS.modelTabTitles ?? {})
            } catch {
              return DEFAULT_SETTINGS.modelTabTitles ?? {}
            }
          })()
        : (DEFAULT_SETTINGS.modelTabTitles ?? {})

    const modelTabOrder = rawOrder.filter((id) => id !== 'custom')
    const enabledModelTabs = rawEnabled.filter((id) => id !== 'custom')
    const modelTabTitles = { ...rawTitles }
    delete modelTabTitles.custom

    return {
      modelTabOrder,
      enabledModelTabs,
      modelTabTitles,
    }
  })(),
  theme: data.theme || 'dark',
  accentColor: data.accent_color || 'teal',
  notifications: data.notifications ?? false,
  soundEnabled: data.sound_enabled ?? false,
  autoSave: data.auto_save ?? true,
  fontScale: data.font_scale ?? 100,
  showPromptTitles: data.show_prompt_titles ?? true,
  promptCategoryOrder: parseJsonArray(
    data.prompt_category_order,
    DEFAULT_SETTINGS.promptCategoryOrder ?? []
  ),
  enabledPromptCategories: parseJsonArray(
    data.enabled_prompt_categories,
    DEFAULT_SETTINGS.enabledPromptCategories ?? []
  ),
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [syncState, setSyncState] = useState<CloudSyncState>(DEFAULT_SYNC_STATE)
  const { setTheme } = useTheme()
  const { isAuthenticated, login, register, logout, user } = useAuth()
  const api = useProtectedApi()
  const syncInProgress = useRef(false)
  const pendingUpdatesRef = useRef<Partial<UserSettings>>({})
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toSyncError = (error: unknown): Pick<CloudSyncState, 'errorCode' | 'errorMessage' | 'requestId'> => {
    if (error instanceof ProtectedApiError) {
      return {
        errorCode: error.code ?? 'SYNC_REQUEST_FAILED',
        errorMessage: error.message,
        requestId: error.requestId ?? null,
      }
    }
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as any).message)
        : 'Sync request failed'
    return {
      errorCode: 'SYNC_REQUEST_FAILED',
      errorMessage: message,
      requestId: null,
    }
  }

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
        setSyncState((prev: CloudSyncState) => ({
          ...prev,
          lastSynced: Date.now(),
          status: 'synced',
          errorCode: null,
          errorMessage: null,
          requestId: null,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      const syncError = toSyncError(error)
      setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'error', ...syncError }))
    }
  }, [api, isAuthenticated])

  const flushPendingSettingsSync = useCallback(async () => {
    if (!isAuthenticated) return
    const updates = pendingUpdatesRef.current
    pendingUpdatesRef.current = {}
    if (Object.keys(updates).length === 0) return
    try {
      await api.post('/api/v1/settings/', mapToBackend(updates))
      setSyncState((prev: CloudSyncState) => ({
        ...prev,
        lastSynced: Date.now(),
        status: 'synced',
        errorCode: null,
        errorMessage: null,
        requestId: null,
      }))
    } catch (error) {
      console.error('Failed to sync settings:', error)
      const syncError = toSyncError(error)
      setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'error', ...syncError }))
    }
  }, [api, isAuthenticated])

  const queueSettingsSync = useCallback(
    (updates: Partial<UserSettings>) => {
      if (!isAuthenticated) return
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates }
      setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'syncing' }))
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = setTimeout(() => {
        void flushPendingSettingsSync()
      }, 250)
    },
    [flushPendingSettingsSync, isAuthenticated]
  )

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
      queueSettingsSync(updates)
    },
    [queueSettingsSync]
  )

  const reorderModelTabs = useCallback(
    async (order: string[], enabled: string[]) => {
      setSettings((prev) => ({
        ...prev,
        modelTabOrder: order,
        enabledModelTabs: enabled,
      }))
      if (!isAuthenticated) return
      try {
        setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'syncing' }))
        const data = await api.post<any>('/api/v1/settings/layout/model-tabs', { order, enabled })
        if (data) {
          setSettings(mapFromBackend(data))
        }
        setSyncState((prev: CloudSyncState) => ({
          ...prev,
          lastSynced: Date.now(),
          status: 'synced',
          errorCode: null,
          errorMessage: null,
          requestId: null,
        }))
      } catch (error) {
        console.error('Failed to reorder model tabs:', error)
        const syncError = toSyncError(error)
        setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'error', ...syncError }))
      }
    },
    [api, isAuthenticated]
  )

  const reorderPromptCategories = useCallback(
    async (order: PromptStatus[], enabled: PromptStatus[]) => {
      setSettings((prev) => ({
        ...prev,
        promptCategoryOrder: order,
        enabledPromptCategories: enabled,
      }))
      if (!isAuthenticated) return
      try {
        setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'syncing' }))
        const data = await api.post<any>('/api/v1/settings/layout/prompt-categories', { order, enabled })
        if (data) {
          setSettings(mapFromBackend(data))
        }
        setSyncState((prev: CloudSyncState) => ({
          ...prev,
          lastSynced: Date.now(),
          status: 'synced',
          errorCode: null,
          errorMessage: null,
          requestId: null,
        }))
      } catch (error) {
        console.error('Failed to reorder prompt categories:', error)
        const syncError = toSyncError(error)
        setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'error', ...syncError }))
      }
    },
    [api, isAuthenticated]
  )

  const updateModelTabTitle = useCallback(
    async (tabId: string, title: string) => {
      const trimmed = title.trim()
      setSettings((prev) => ({
        ...prev,
        modelTabTitles: { ...(prev.modelTabTitles ?? {}), [tabId]: trimmed },
      }))
      if (!isAuthenticated) return
      try {
        setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'syncing' }))
        const data = await api.post<any>('/api/v1/settings/layout/model-tab-title', {
          tab_id: tabId,
          title: trimmed,
        })
        if (data) {
          setSettings(mapFromBackend(data))
        }
        setSyncState((prev: CloudSyncState) => ({
          ...prev,
          lastSynced: Date.now(),
          status: 'synced',
          errorCode: null,
          errorMessage: null,
          requestId: null,
        }))
      } catch (error) {
        console.error('Failed to update model tab title:', error)
        const syncError = toSyncError(error)
        setSyncState((prev: CloudSyncState) => ({ ...prev, status: 'error', ...syncError }))
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
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }
    pendingUpdatesRef.current = {}
    logout()
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('ondeck-settings')
    setSyncState(DEFAULT_SYNC_STATE)
  }, [logout])

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  const cloudSync = {
    isConnected: isAuthenticated,
    status: syncState.status,
    lastSynced: syncState.lastSynced,
    user: user ? { email: user.email } : null,
    errorCode: syncState.errorCode ?? null,
    errorMessage: syncState.errorMessage ?? null,
    requestId: syncState.requestId ?? null,
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        syncState,
        cloudSync,
        updateSettings,
        reorderModelTabs,
        reorderPromptCategories,
        updateModelTabTitle,
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
