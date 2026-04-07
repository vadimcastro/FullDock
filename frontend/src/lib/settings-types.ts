import type { AIModel, PromptStatus } from '@/lib/types'

export type AccentColor = 'teal' | 'blue' | 'purple' | 'green' | 'coral'

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error'

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  accentColor: AccentColor
  notifications?: boolean
  soundEnabled?: boolean
  autoSave?: boolean
  fontScale?: number
  showPromptTitles?: boolean
  modelTabOrder?: string[]
  enabledModelTabs?: string[]
  modelTabTitles?: Record<string, string>
  promptCategoryOrder?: PromptStatus[]
  enabledPromptCategories?: PromptStatus[]
}

export interface CloudSyncState {
  status: SyncStatus
  lastSynced: number | null
  isAuthenticated: boolean
  userEmail: string | null
}

export interface CloudSyncInfo {
  isConnected: boolean
  status: SyncStatus
  lastSynced: number | null
  user: { email: string } | null
}

export interface SettingsContextValue {
  settings: UserSettings
  syncState: CloudSyncState
  cloudSync: CloudSyncInfo
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
  triggerSync: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
}

export const ACCENT_COLORS: { id: AccentColor; label: string; hue: number }[] = [
  { id: 'teal', label: 'Teal', hue: 200 },
  { id: 'blue', label: 'Blue', hue: 240 },
  { id: 'purple', label: 'Purple', hue: 280 },
  { id: 'green', label: 'Green', hue: 145 },
  { id: 'coral', label: 'Coral', hue: 30 },
]

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accentColor: 'teal',
  notifications: false,
  soundEnabled: false,
  autoSave: true,
  fontScale: 100,
  showPromptTitles: true,
  modelTabOrder: ['claude', 'gemini', 'gpt', 'grok'],
  enabledModelTabs: ['claude', 'gemini', 'gpt', 'grok'],
  modelTabTitles: {
    claude: 'Claude',
    gemini: 'Gemini',
    gpt: 'GPT',
    grok: 'Grok',
  },
  promptCategoryOrder: ['on-deck', 'needs-edit', 'queued', 'forked', 'complete'],
  enabledPromptCategories: ['on-deck', 'needs-edit', 'queued', 'forked', 'complete'],
}

export const DEFAULT_SYNC_STATE: CloudSyncState = {
  status: 'offline',
  lastSynced: null,
  isAuthenticated: false,
  userEmail: null,
}
