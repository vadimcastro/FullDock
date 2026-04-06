'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X } from 'lucide-react'
import { PromptCard } from '@/components/prompt-card'
import type { AIModel, Prompt, PromptStatus, ModelConfig } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ModelViewProps {
  model: ModelConfig
  prompts: Prompt[]
  allPrompts: Prompt[]
  onAddPrompt: (modelId: AIModel, content: string, notes: string) => void
  onUpdateStatus: (id: string, status: PromptStatus) => void
  onUpdatePrompt: (id: string, updates: Partial<Pick<Prompt, 'content' | 'notes' | 'linkedPromptId'>>) => void
  onDelete: (id: string) => void
  getPromptById: (id: string) => Prompt | undefined
}

export function ModelView({
  model,
  prompts,
  allPrompts,
  onAddPrompt,
  onUpdateStatus,
  onUpdatePrompt,
  onDelete,
  getPromptById,
}: ModelViewProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newNotes, setNewNotes] = useState('')

  const onDeck = prompts.find((p) => p.status === 'on-deck')
  const needsEdit = prompts.filter((p) => p.status === 'needs-edit')
  const queued = prompts.filter((p) => p.status === 'queued')
  const complete = prompts.filter((p) => p.status === 'complete')

  const handleAdd = () => {
    if (newContent.trim()) {
      onAddPrompt(model.id, newContent.trim(), newNotes.trim())
      setNewContent('')
      setNewNotes('')
      setIsAdding(false)
    }
  }

  const modelColorClass = {
    claude: 'border-claude',
    gpt: 'border-gpt',
    grok: 'border-grok',
    gemini: 'border-gemini',
  }[model.id]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b-2 bg-card/50 shrink-0',
          modelColorClass
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg',
              model.color,
              'text-background'
            )}
          >
            {model.icon}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{model.name}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {onDeck && <span className="text-primary font-medium">1 active</span>}
              {needsEdit.length > 0 && (
                <span className="text-warning font-medium">{needsEdit.length} needs edit</span>
              )}
              {queued.length > 0 && <span>{queued.length} queued</span>}
              {complete.length > 0 && <span className="text-success">{complete.length} done</span>}
              {prompts.length === 0 && <span>No prompts</span>}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant={isAdding ? 'secondary' : 'default'}
          className="gap-1.5 font-medium"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAdding ? 'Cancel' : 'Add Prompt'}
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="p-4 border-b border-border bg-secondary/30 shrink-0 overflow-y-auto max-h-[40vh]">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Prompt Content
              </label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter the prompt you want to send to this AI model..."
                className="min-h-[100px] text-sm leading-relaxed resize-none"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Add context, track progress, or reference other AI threads..."
                className="min-h-[70px] text-sm leading-relaxed resize-none"
              />
            </div>
            <Button 
              onClick={handleAdd} 
              disabled={!newContent.trim()} 
              className="w-full font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add to Queue
            </Button>
          </div>
        </div>
      )}

      {/* Prompts List - Vertical scrolling */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {/* On Deck Section */}
          {onDeck && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                  On Deck
                </h3>
              </div>
              <PromptCard
                prompt={onDeck}
                onUpdateStatus={onUpdateStatus}
                onUpdatePrompt={onUpdatePrompt}
                onDelete={onDelete}
                linkedPrompt={
                  onDeck.linkedPromptId
                    ? getPromptById(onDeck.linkedPromptId)
                    : undefined
                }
                allPrompts={allPrompts}
              />
            </section>
          )}

          {/* Needs Edit Section */}
          {needsEdit.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <h3 className="text-xs font-semibold text-warning uppercase tracking-wider">
                  Needs Edit ({needsEdit.length})
                </h3>
              </div>
              <div className="space-y-3">
                {needsEdit.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onUpdateStatus={onUpdateStatus}
                    onUpdatePrompt={onUpdatePrompt}
                    onDelete={onDelete}
                    linkedPrompt={
                      prompt.linkedPromptId
                        ? getPromptById(prompt.linkedPromptId)
                        : undefined
                    }
                    allPrompts={allPrompts}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Queued Section */}
          {queued.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Queued ({queued.length})
                </h3>
              </div>
              <div className="space-y-3">
                {queued.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onUpdateStatus={onUpdateStatus}
                    onUpdatePrompt={onUpdatePrompt}
                    onDelete={onDelete}
                    linkedPrompt={
                      prompt.linkedPromptId
                        ? getPromptById(prompt.linkedPromptId)
                        : undefined
                    }
                    allPrompts={allPrompts}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Complete Section */}
          {complete.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-success" />
                <h3 className="text-xs font-semibold text-success uppercase tracking-wider">
                  Complete ({complete.length})
                </h3>
              </div>
              <div className="space-y-3">
                {complete.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onUpdateStatus={onUpdateStatus}
                    onUpdatePrompt={onUpdatePrompt}
                    onDelete={onDelete}
                    linkedPrompt={
                      prompt.linkedPromptId
                        ? getPromptById(prompt.linkedPromptId)
                        : undefined
                    }
                    allPrompts={allPrompts}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {prompts.length === 0 && !isAdding && (
            <div className="text-center py-16">
              <div 
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-4 opacity-50',
                  model.color,
                  'text-background'
                )}
              >
                {model.icon}
              </div>
              <p className="text-muted-foreground mb-4 text-sm">
                No prompts for {model.name} yet
              </p>
              <Button onClick={() => setIsAdding(true)} variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add your first prompt
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
