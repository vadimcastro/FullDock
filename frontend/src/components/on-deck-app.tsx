'use client'

import { useState, useCallback } from 'react'
import { usePrompts } from '@/hooks/use-prompts'
import { AI_MODELS } from '@/lib/types'
import { ModelTabs } from '@/components/model-tabs'
import { ModelView } from '@/components/model-view'
import { SwipeContainer } from '@/components/swipe-container'
import { PreferencesView } from '@/components/preferences-view'
import { CloudSyncButton } from '@/components/cloud-sync'
import { Layers } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { playUiTabSwitchSound } from '@/lib/sound-effects'

// Total tabs: 4 AI models + 1 Preferences
const TOTAL_TABS = AI_MODELS.length + 1

export function OnDeckApp() {
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
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

  const handleTabSelect = useCallback(
    (index: number) => {
      if (settings.soundEnabled && index !== currentModelIndex) {
        playUiTabSwitchSound()
      }
      setCurrentModelIndex(index)
    },
    [currentModelIndex, settings.soundEnabled]
  )

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      setCurrentModelIndex((prev) => {
        let next = prev
        if (direction === 'left') {
          next = Math.min(prev + 1, TOTAL_TABS - 1)
        } else {
          next = Math.max(prev - 1, 0)
        }
        if (settings.soundEnabled && next !== prev) {
          playUiTabSwitchSound()
        }
        return next
      })
    },
    [settings.soundEnabled]
  )

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
          totalTabs={TOTAL_TABS}
        />
      </div>

      {/* Swipeable Content - Takes remaining height with proper overflow */}
      <SwipeContainer
        currentIndex={currentModelIndex}
        onSwipe={handleSwipe}
        className="flex-1 min-h-0"
      >
        {[
          ...AI_MODELS.map((model) => (
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
          )),
          <PreferencesView key="preferences" />
        ]}
      </SwipeContainer>

      {/* Swipe Hint / Navigation Dots */}
      <div className="flex justify-center gap-2 py-2 bg-card border-t border-border shrink-0">
        {Array.from({ length: TOTAL_TABS }).map((_, index) => (
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
            aria-label={index < AI_MODELS.length ? AI_MODELS[index].name : 'Settings'}
          />
        ))}
      </div>
    </div>
  )
}
