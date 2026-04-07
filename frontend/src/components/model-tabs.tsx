'use client'

import Image from 'next/image'
import type { AIModel, ModelConfig, Prompt } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Settings } from 'lucide-react'

interface ModelTabsProps {
  currentIndex: number
  onSelect: (index: number) => void
  prompts: Prompt[]
  models: ModelConfig[]
}

export function ModelTabs({ currentIndex, onSelect, prompts, models }: ModelTabsProps) {
  const getStats = (modelId: AIModel) => {
    const modelPrompts = prompts.filter((p) => p.modelId === modelId)
    const onDeck = modelPrompts.filter((p) => p.status === 'on-deck').length
    const needsEdit = modelPrompts.filter((p) => p.status === 'needs-edit').length
    return { total: modelPrompts.length, onDeck, needsEdit }
  }

  const prefsIndex = models.length

  return (
    <div className="flex overflow-x-auto scrollbar-hide border-b border-border bg-card">
      {models.map((model, index) => {
        const stats = getStats(model.id)
        const isActive = index === currentIndex

        const colorClass = ({
          claude: 'border-claude',
          gpt: 'border-gpt',
          grok: 'border-grok',
          gemini: 'border-gemini',
        } as Record<string, string>)[model.id] ?? 'border-primary'

        return (
          <button
            key={model.id}
            onClick={() => onSelect(index)}
            className={cn(
              'flex-1 flex flex-col items-center py-2 px-1 transition-all relative min-w-[56px]',
              'border-b-2 -mb-[2px]',
              isActive ? colorClass : 'border-transparent',
              isActive ? 'bg-secondary/35' : 'hover:bg-secondary/20'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center mb-1 bg-white ring-1 ring-border'
              )}
            >
              {model.logoSrc ? (
                <Image
                  src={model.logoSrc}
                  alt={`${model.name} logo`}
                  width={model.id === 'gpt' ? 24 : 18}
                  height={model.id === 'gpt' ? 24 : 18}
                  className={cn(
                    'object-contain',
                    model.id === 'gpt' ? 'h-6 w-6' : 'h-[18px] w-[18px]'
                  )}
                />
              ) : (
                <span className="text-xs font-medium text-foreground">{model.icon}</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {model.name}
            </span>

            {/* Status indicators */}
            {(stats.onDeck > 0 || stats.needsEdit > 0) && (
              <div className="absolute top-1 right-1 flex gap-0.5">
                {stats.onDeck > 0 && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
                {stats.needsEdit > 0 && (
                  <span className="w-2 h-2 rounded-full bg-warning" />
                )}
              </div>
            )}
          </button>
        )
      })}

      {/* Preferences Tab */}
      <button
        onClick={() => onSelect(prefsIndex)}
        className={cn(
          'flex-1 flex flex-col items-center py-2 px-1 transition-all relative min-w-[60px]',
          'border-b-2 -mb-[2px]',
          currentIndex === prefsIndex ? 'border-foreground' : 'border-transparent',
          currentIndex === prefsIndex ? 'bg-secondary/35' : 'hover:bg-secondary/20'
        )}
      >
        <div
          className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium mb-1',
            'bg-secondary ring-1 ring-border text-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
        </div>
        <span className="text-[10px] text-muted-foreground">
          Settings
        </span>
      </button>
    </div>
  )
}
