'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Plus, X, ChevronDown, ChevronUp, GitFork, Trash2 } from 'lucide-react'
import { PromptCard } from '@/components/prompt-card'
import type { AIModel, Prompt, PromptStatus, ModelConfig } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useSettings } from '@/hooks/use-settings'

interface ModelViewProps {
  model: ModelConfig
  prompts: Prompt[]
  allPrompts: Prompt[]
  onAddPrompt: (modelId: AIModel, content: string, notes: string, title?: string, initialStatus?: PromptStatus) => void
  onUpdateStatus: (id: string, status: PromptStatus) => void
  onUpdatePrompt: (id: string, updates: Partial<Pick<Prompt, 'title' | 'content' | 'notes' | 'linkedPromptId'>>) => void
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
  const { settings } = useSettings()
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [expandedCompleteIds, setExpandedCompleteIds] = useState<Set<string>>(new Set())

  const onDeck = prompts.find((p) => p.status === 'on-deck')
  const needsEdit = prompts.filter((p) => p.status === 'needs-edit')
  const queued = prompts.filter((p) => p.status === 'queued')
  const forked = prompts.filter((p) => p.status === 'forked')
  const complete = prompts.filter((p) => p.status === 'complete')
  const [collapsedSections, setCollapsedSections] = useState({
    onDeck: false,
    needsEdit: false,
    queued: false,
    forked: false,
    complete: false,
  })

  const handleAdd = () => {
    if (newContent.trim()) {
      onAddPrompt(model.id, newContent.trim(), newNotes.trim(), newTitle.trim())
      setNewTitle('')
      setNewContent('')
      setNewNotes('')
      setIsAdding(false)
    }
  }

  const getPromptListTitle = (prompt: Prompt): string => {
    if (settings.showPromptTitles && prompt.title?.trim()) {
      return prompt.title.trim()
    }
    return prompt.content
  }

  const modelColorClass = {
    claude: 'border-claude',
    gpt: 'border-gpt',
    grok: 'border-grok',
    gemini: 'border-gemini',
  }[model.id]

  const toggleSection = (key: keyof typeof collapsedSections) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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
              {forked.length > 0 && <span className="text-primary">{forked.length} forked</span>}
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
            {settings.showPromptTitles && (
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">
                  Prompt Name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Give this prompt a short title..."
                  className="text-sm"
                />
              </div>
            )}
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
              <button
                type="button"
                onClick={() => toggleSection('onDeck')}
                className="flex items-center gap-2 mb-3 w-full text-left"
              >
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider flex-1">
                  On Deck
                </h3>
                {collapsedSections.onDeck ? (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-primary" />
                )}
              </button>
              {!collapsedSections.onDeck && (
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
              )}
            </section>
          )}

          {/* Needs Edit Section */}
          {needsEdit.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => toggleSection('needsEdit')}
                className="flex items-center gap-2 mb-3 w-full text-left"
              >
                <div className="h-2 w-2 rounded-full bg-warning" />
                <h3 className="text-xs font-semibold text-warning uppercase tracking-wider flex-1">
                  Needs Edit ({needsEdit.length})
                </h3>
                {collapsedSections.needsEdit ? (
                  <ChevronDown className="h-4 w-4 text-warning" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-warning" />
                )}
              </button>
              {!collapsedSections.needsEdit && (
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
              )}
            </section>
          )}

          {/* Queued Section */}
          {queued.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => toggleSection('queued')}
                className="flex items-center gap-2 mb-3 w-full text-left"
              >
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
                  Queued ({queued.length})
                </h3>
                {collapsedSections.queued ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {!collapsedSections.queued && (
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
              )}
            </section>
          )}

          {/* Forked Section */}
          {forked.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => toggleSection('forked')}
                className="flex items-center gap-2 mb-3 w-full text-left"
              >
                <div className="h-2 w-2 rounded-full bg-claude" />
                <h3 className="text-xs font-semibold text-claude uppercase tracking-wider flex-1">
                  Forked ({forked.length})
                </h3>
                {collapsedSections.forked ? (
                  <ChevronDown className="h-4 w-4 text-claude" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-claude" />
                )}
              </button>
              {!collapsedSections.forked && (
                <div className="space-y-3">
                  {forked.map((prompt) => (
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
              )}
            </section>
          )}

          {/* Complete Section */}
          {complete.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => toggleSection('complete')}
                className="flex items-center gap-2 mb-3 w-full text-left"
              >
                <div className="h-2 w-2 rounded-full bg-success" />
                <h3 className="text-xs font-semibold text-success uppercase tracking-wider flex-1">
                  Complete ({complete.length})
                </h3>
                {collapsedSections.complete ? (
                  <ChevronDown className="h-4 w-4 text-success" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-success" />
                )}
              </button>
              {!collapsedSections.complete && (
                <div className="space-y-2.5">
                  {complete.map((prompt) => (
                    <div key={prompt.id} className="rounded-lg border border-success/50 bg-success/5 overflow-hidden">
                      <div className="w-full flex items-center gap-2 px-3 py-2 hover:bg-success/10 transition-colors">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedCompleteIds((prev) => {
                              const next = new Set(prev)
                              if (next.has(prompt.id)) {
                                next.delete(prompt.id)
                              } else {
                                next.add(prompt.id)
                              }
                              return next
                            })
                          }}
                          className="flex items-center gap-2 text-left flex-1 min-w-0"
                        >
                          {expandedCompleteIds.has(prompt.id) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <p className="text-sm truncate flex-1">{getPromptListTitle(prompt)}</p>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 gap-1"
                            onClick={() => {
                              onAddPrompt(
                                model.id,
                                prompt.content,
                                prompt.notes,
                                prompt.title?.trim() ?? '',
                                'forked'
                              )
                            }}
                          >
                            <GitFork className="h-3.5 w-3.5" />
                            Fork
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 gap-1 text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/10"
                            onClick={() => onDelete(prompt.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {expandedCompleteIds.has(prompt.id) && (
                        <div className="px-2.5 pt-2.5 pb-2.5 border-t border-success/30 bg-success/10 space-y-3">
                          <div className="w-full text-left p-3 pt-3.5 bg-secondary/50 rounded-md border-l-2 border-primary">
                            <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wide">PROMPT TEXT</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                              {prompt.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 px-3.5"
                              onClick={() => {
                                onAddPrompt(
                                  model.id,
                                  prompt.content,
                                  prompt.notes,
                                  prompt.title?.trim() ?? '',
                                  'forked'
                                )
                              }}
                            >
                              <GitFork className="h-3.5 w-3.5" />
                              Fork
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 px-3.5 text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/10"
                              onClick={() => onDelete(prompt.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
