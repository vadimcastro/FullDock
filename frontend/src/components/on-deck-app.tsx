'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { usePrompts } from '@/hooks/use-prompts'
import { AI_MODELS, type ModelConfig } from '@/lib/types'
import { ModelTabs } from '@/components/model-tabs'
import { ModelView } from '@/components/model-view'
import { SwipeContainer } from '@/components/swipe-container'
import { PreferencesView } from '@/components/preferences-view'
import { CloudSyncButton } from '@/components/cloud-sync'
import { Layers } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { playUiTabSwitchSound } from '@/lib/sound-effects'
import { ACCENT_COLORS } from '@/lib/settings-types'

const FAMILY_ALIASES: Array<{ family: 'claude' | 'gemini' | 'gpt' | 'grok'; patterns: RegExp[] }> = [
  { family: 'claude', patterns: [/^claude/i, /^sonnet/i, /^haiku/i] },
  { family: 'gemini', patterns: [/^gemini/i] },
  { family: 'gpt', patterns: [/^gpt/i] },
  { family: 'grok', patterns: [/^grok/i] },
]

function detectFamily(id: string, title: string): 'claude' | 'gemini' | 'gpt' | 'grok' | undefined {
  const idLower = id.toLowerCase()
  const titleLower = title.toLowerCase()
  const idTail = idLower.startsWith('custom-') ? idLower.slice(7) : idLower
  for (const entry of FAMILY_ALIASES) {
    if (
      entry.patterns.some(
        (p) => p.test(idLower) || p.test(idTail) || p.test(titleLower)
      )
    ) {
      return entry.family
    }
  }
  return undefined
}

function hueForModelId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return ACCENT_COLORS[hash % ACCENT_COLORS.length].hue
}

export function OnDeckApp() {
  const [currentTabId, setCurrentTabId] = useState<string>('')
  const [hasUserSelectedTab, setHasUserSelectedTab] = useState<boolean>(false)
  const { settings } = useSettings()
  const {
    prompts,
    isLoaded,
    getPromptsForModel,
    addPrompt,
    updatePrompt,
    updateStatus,
    deletePrompt,
    getPromptById,
  } = usePrompts()

  const visibleModels = useMemo<ModelConfig[]>(() => {
    const defaultMap = new Map(AI_MODELS.map((m) => [m.id, m]))
    const order = settings.modelTabOrder ?? ['claude', 'gemini', 'gpt', 'grok']
    const enabled = new Set<string>(settings.enabledModelTabs ?? ['claude', 'gemini', 'gpt', 'grok'])
    const titles = settings.modelTabTitles ?? {}

    const knownIds = new Set<string>([
      ...AI_MODELS.map((m) => m.id),
      ...order,
      ...Array.from(enabled),
      ...Object.keys(titles),
    ])
    const modelMap = new Map<string, ModelConfig>()
    for (const id of Array.from(knownIds)) {
      const defaultModel = defaultMap.get(id)
      if (defaultModel) {
        modelMap.set(id, defaultModel)
        continue
      }
      const title = titles[id]?.trim() || id
      const family = detectFamily(id, title)
      const matchedDefault = family ? AI_MODELS.find((m) => m.family === family) : undefined
      const icon = title
        .split(/\s+/)
        .filter(Boolean)
        .map((word: string) => word[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 2) || title.slice(0, 2).toUpperCase() || 'M'
      modelMap.set(id, {
        id,
        name: title,
        color: 'bg-muted',
        icon: icon.slice(0, 1),
        logoSrc: matchedDefault?.logoSrc,
        family,
        iconHue: hueForModelId(id),
      })
    }

    const ordered = order
      .filter((id) => modelMap.has(id))
      .filter((id) => enabled.has(id))

    const result = ordered
      .map((id) => modelMap.get(id))
      .filter((m): m is ModelConfig => Boolean(m))
      .map((model) =>
        ({
          ...model,
          name: titles[model.id]?.trim() || model.name,
        })
      )

    if (result.length > 0) return result
    const fallback = modelMap.get('gpt')
    return fallback ? [fallback] : []
  }, [
    settings.modelTabOrder,
    settings.enabledModelTabs,
    settings.modelTabTitles,
  ])

  const tabIds = useMemo(() => [...visibleModels.map((m) => m.id), 'settings'], [visibleModels])
  const preferredInitialTabId = visibleModels[0]?.id ?? 'settings'
  const currentModelIndex = Math.max(0, tabIds.indexOf(currentTabId))
  const totalTabs = tabIds.length

  useEffect(() => {
    if (hasUserSelectedTab) return
    setCurrentTabId(preferredInitialTabId)
  }, [hasUserSelectedTab, preferredInitialTabId])

  useEffect(() => {
    if (currentTabId === 'settings') return
    if (visibleModels.some((m) => m.id === currentTabId)) return
    setCurrentTabId(visibleModels[0]?.id ?? 'settings')
  }, [currentTabId, visibleModels])

  const handleTabSelect = useCallback(
    (index: number) => {
      setHasUserSelectedTab(true)
      if (settings.soundEnabled && index !== currentModelIndex) {
        playUiTabSwitchSound()
      }
      setCurrentTabId(tabIds[index] ?? 'settings')
    },
    [currentModelIndex, settings.soundEnabled, tabIds]
  )

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      setHasUserSelectedTab(true)
      const prev = currentModelIndex
      let next = prev
      if (direction === 'left') {
        next = Math.min(prev + 1, totalTabs - 1)
      } else {
        next = Math.max(prev - 1, 0)
      }
      if (settings.soundEnabled && next !== prev) {
        playUiTabSwitchSound()
      }
      setCurrentTabId(tabIds[next] ?? 'settings')
    },
    [currentModelIndex, settings.soundEnabled, tabIds, totalTabs]
  )

  const isSettingsTab = currentTabId === 'settings'
  const activeModelIndex = Math.max(0, visibleModels.findIndex((m) => m.id === currentTabId))

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Layers className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* App Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="font-semibold text-lg">On Deck</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {prompts.filter((p) => p.status === 'on-deck').length} active
          </span>
          <CloudSyncButton />
        </div>
      </header>

      {/* Model Tabs - Horizontal scroll on mobile */}
      <div className="shrink-0">
        <ModelTabs
          currentIndex={currentModelIndex}
          onSelect={handleTabSelect}
          prompts={prompts}
          models={visibleModels}
        />
      </div>

      {/* Content */}
      {isSettingsTab ? (
        <div className="flex-1 min-h-0">
          <PreferencesView />
        </div>
      ) : (
        <SwipeContainer
          currentIndex={activeModelIndex}
          onSwipe={handleSwipe}
          className="flex-1 min-h-0"
        >
          {visibleModels.map((model) => (
            <ModelView
              key={model.id}
              model={model}
              prompts={getPromptsForModel(model.id)}
              allPrompts={prompts}
              onAddPrompt={addPrompt}
              onUpdateStatus={updateStatus}
              onUpdatePrompt={updatePrompt}
              onDelete={deletePrompt}
              getPromptById={getPromptById}
            />
          ))}
        </SwipeContainer>
      )}

      {/* Swipe Hint / Navigation Dots */}
      <div className="flex justify-center gap-2 py-2 bg-card border-t border-border shrink-0">
        {Array.from({ length: totalTabs }).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              handleTabSelect(index)
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentModelIndex
                ? 'bg-primary w-4'
                : 'bg-muted-foreground/30'
            }`}
            aria-label={index < visibleModels.length ? visibleModels[index].name : 'Settings'}
          />
        ))}
      </div>
    </div>
  )
}
