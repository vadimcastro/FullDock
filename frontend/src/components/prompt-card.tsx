'use client'

import { useState, useCallback, useEffect, useRef, type MouseEvent } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Check,
  Edit3,
  Trash2,
  AlertTriangle,
  Link2,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  CheckCheck,
} from 'lucide-react'
import type { Prompt, PromptStatus, AIModel } from '@/lib/types'
import { AI_MODELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useSettings } from '@/hooks/use-settings'
import {
  playUiClickSound,
  playUiCompleteSound,
  playUiCopySound,
  playUiDeleteSound,
  playUiNeedsEditSound,
  playUiRetrySound,
} from '@/lib/sound-effects'

interface PromptCardProps {
  prompt: Prompt
  onUpdateStatus: (id: string, status: PromptStatus) => void
  onUpdatePrompt: (id: string, updates: Partial<Pick<Prompt, 'title' | 'content' | 'notes' | 'linkedPromptId'>>) => void
  onDelete: (id: string) => void
  linkedPrompt?: Prompt
  allPrompts: Prompt[]
}

export function PromptCard({
  prompt,
  onUpdateStatus,
  onUpdatePrompt,
  onDelete,
  linkedPrompt,
  allPrompts,
}: PromptCardProps) {
  const { settings } = useSettings()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(prompt.title ?? '')
  const [editContent, setEditContent] = useState(prompt.content)
  const [editNotes, setEditNotes] = useState(prompt.notes)
  const [isExpanded, setIsExpanded] = useState(prompt.status === 'on-deck')
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [copied, setCopied] = useState(false)
  const [focusField, setFocusField] = useState<'content' | 'notes' | null>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const playIfEnabled = (play: () => void) => {
    if (!settings.soundEnabled) return
    play()
  }

  const handleCopy = useCallback(async () => {
    if (!prompt.content) return
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      playIfEnabled(playUiCopySound)
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = prompt.content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      playIfEnabled(playUiCopySound)
    }
  }, [prompt.content, settings.soundEnabled])

  const handleSave = () => {
    onUpdatePrompt(prompt.id, { title: editTitle, content: editContent, notes: editNotes })
    setIsEditing(false)
    setFocusField(null)
  }

  const handleCancel = () => {
    setEditTitle(prompt.title ?? '')
    setEditContent(prompt.content)
    setEditNotes(prompt.notes)
    setIsEditing(false)
    setFocusField(null)
  }

  const startEditing = (field: 'content' | 'notes') => {
    setEditTitle(prompt.title ?? '')
    setEditContent(prompt.content)
    setEditNotes(prompt.notes)
    setIsExpanded(true)
    setIsEditing(true)
    setFocusField(field)
  }

  useEffect(() => {
    if (!isEditing || !focusField) return
    const target = focusField === 'content'
      ? contentTextareaRef.current
      : notesTextareaRef.current

    if (!target) return
    const frame = requestAnimationFrame(() => {
      target.focus()
      const end = target.value.length
      target.setSelectionRange(end, end)
    })
    return () => cancelAnimationFrame(frame)
  }, [isEditing, focusField])

  const linkedModel = linkedPrompt
    ? AI_MODELS.find((m) => m.id === linkedPrompt.modelId)
    : null

  const otherModelPrompts = allPrompts.filter(
    (p) => p.modelId !== prompt.modelId && p.status !== 'complete'
  )

  const statusAccent = {
    'on-deck': {
      border: 'border-primary',
      text: 'text-primary',
    },
    'needs-edit': {
      border: 'border-warning',
      text: 'text-warning',
    },
    'queued': {
      border: 'border-grok',
      text: 'text-grok',
    },
    'forked': {
      border: 'border-claude',
      text: 'text-claude',
    },
    'complete': {
      border: 'border-success',
      text: 'text-success',
    },
  }[prompt.status]

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (isEditing) return
    const target = event.target as HTMLElement
    if (target.closest('button, textarea, input, select, a, [role="button"], [data-no-card-expand="true"]')) {
      return
    }
    setIsExpanded((prev) => !prev)
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'transition-all duration-200',
        prompt.status === 'on-deck' && 'ring-2 ring-primary',
        prompt.status === 'needs-edit' && 'ring-2 ring-warning',
        prompt.status === 'queued' && 'ring-2 ring-grok/60',
        prompt.status === 'forked' && 'ring-2 ring-claude/70',
        prompt.status === 'complete' && 'opacity-60'
      )}
    >
      <CardHeader className="flex items-center justify-between gap-1 px-2 pt-0 pb-0">
        <Button
          variant={copied ? 'default' : 'secondary'}
          size="sm"
            className={cn(
            'h-6 w-6 p-0 shrink-0 transition-all duration-200',
            copied && 'bg-success hover:bg-success text-background'
          )}
          onClick={handleCopy}
          disabled={!prompt.content}
          aria-label={copied ? 'Copied' : 'Copy prompt'}
          title={copied ? 'Copied' : 'Copy prompt'}
        >
          {copied ? (
            <CheckCheck className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>

        {linkedPrompt && linkedModel && (
          <Badge variant="outline" className="shrink-0 gap-1 text-[10px] py-0">
            <Link2 className="h-3 w-3" />
            {linkedModel.name}
          </Badge>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant={copied ? 'default' : 'secondary'}
            size="sm"
            className={cn(
              'h-6 w-6 p-0 shrink-0 transition-all duration-200',
              copied && 'bg-success hover:bg-success text-background'
            )}
            onClick={handleCopy}
            disabled={!prompt.content}
            aria-label={copied ? 'Copied' : 'Copy prompt'}
            title={copied ? 'Copied' : 'Copy prompt'}
          >
            {copied ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-2.5 pt-0 pb-0.5">
        {isEditing ? (
          <div className="space-y-3">
            {settings.showPromptTitles && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  TITLE <span className="text-[10px]">(OPTIONAL)</span>
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                  placeholder="Add a short prompt title..."
                />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                PROMPT TEXT
              </label>
              <Textarea
                ref={contentTextareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] text-sm"
                placeholder="Enter your prompt..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                NOTES <span className="text-[10px]">(OPTIONAL)</span>
              </label>
              <Textarea
                ref={notesTextareaRef}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="min-h-[60px] text-sm"
                placeholder="Add notes or context..."
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="flex-1">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {settings.showPromptTitles && prompt.title?.trim() && (
              <p className="px-1 mt-0 mb-4 text-[19px] font-semibold text-foreground leading-snug">
                {prompt.title.trim()}
              </p>
            )}

            <div
              role="button"
              tabIndex={0}
              onClick={() => startEditing('content')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  startEditing('content')
                }
              }}
              className={cn(
                'w-full text-left p-3 bg-secondary/50 rounded-md border-l-2 hover:bg-secondary/70 transition-colors cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                statusAccent.border
              )}
              aria-label="Edit prompt text"
            >
              <p className={cn('text-xs font-medium mb-1 uppercase tracking-wide', statusAccent.text)}>PROMPT TEXT</p>
              <pre className={cn(
                'whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground/90',
                !isExpanded && 'line-clamp-2'
              )}>
                {prompt.content || 'No prompt content'}
              </pre>
            </div>

            {isExpanded && (
              <>
                <button
                  type="button"
                  onClick={() => startEditing('notes')}
                  className={cn(
                    'mt-3 w-full text-left p-3 bg-secondary/50 rounded-md border-l-2 hover:bg-secondary/70 transition-colors',
                    statusAccent.border
                  )}
                >
                  <p className={cn('text-xs font-medium mb-1 uppercase tracking-wide', statusAccent.text)}>NOTES</p>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {prompt.notes || 'Click to add notes or context...'}
                  </p>
                </button>

                {linkedPrompt && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-md border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Linked to {linkedModel?.name}
                      </p>
                    </div>
                    <p className="text-sm line-clamp-2 text-foreground/80">{linkedPrompt.content}</p>
                  </div>
                )}

                {showLinkPicker && (
                  <div className="mt-3 p-2 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">
                        Link to another prompt:
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowLinkPicker(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-[120px] overflow-y-auto">
                      {otherModelPrompts.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">
                          No prompts in other models
                        </p>
                      ) : (
                        otherModelPrompts.map((p) => {
                          const model = AI_MODELS.find((m) => m.id === p.modelId)
                          return (
                            <button
                              key={p.id}
                              className="w-full text-left p-2 rounded hover:bg-secondary text-sm flex items-center gap-2"
                              onClick={() => {
                                onUpdatePrompt(prompt.id, { linkedPromptId: p.id })
                                setShowLinkPicker(false)
                              }}
                            >
                              <Badge
                                variant="outline"
                                className="shrink-0 text-xs"
                              >
                                {model?.name}
                              </Badge>
                              <span className="line-clamp-1">{p.content}</span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-border/50">
              <div className="flex flex-wrap items-center gap-2">
                {prompt.status === 'on-deck' && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1.5 px-3.5 bg-success hover:bg-success/90 active:bg-success/85 text-white hover:!text-black active:!text-black font-medium"
                      onClick={() => {
                        playIfEnabled(playUiCompleteSound)
                        onUpdateStatus(prompt.id, 'complete')
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 px-3.5 border-warning/60 text-warning hover:bg-warning hover:!text-white hover:border-warning active:bg-warning/90 active:!text-white"
                      onClick={() => {
                        playIfEnabled(playUiNeedsEditSound)
                        onUpdateStatus(prompt.id, 'needs-edit')
                      }}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Needs Edit
                    </Button>
                  </>
                )}

                {prompt.status === 'needs-edit' && (
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5 px-3.5"
                    onClick={() => {
                      playIfEnabled(playUiRetrySound)
                      onUpdateStatus(prompt.id, 'on-deck')
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Ready to Retry
                  </Button>
                )}

                {prompt.status === 'queued' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 px-3.5 border-grok/60 text-grok hover:bg-grok hover:!text-white hover:border-grok active:bg-grok/90 active:!text-white"
                    onClick={() => {
                      playIfEnabled(playUiClickSound)
                      onUpdateStatus(prompt.id, 'on-deck')
                    }}
                  >
                  Move to On Deck
                </Button>
                )}

                {prompt.status === 'forked' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 px-3.5 border-claude/60 text-claude hover:bg-claude hover:!text-white hover:border-claude active:bg-claude/90 active:!text-white"
                    onClick={() => {
                      playIfEnabled(playUiClickSound)
                      onUpdateStatus(prompt.id, 'on-deck')
                    }}
                  >
                    Move to On Deck
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => startEditing('content')}
                  title="Edit"
                  aria-label="Edit prompt"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setIsExpanded(true)
                    setShowLinkPicker(!showLinkPicker)
                  }}
                  title="Link prompt"
                  aria-label="Link prompt"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    playIfEnabled(playUiDeleteSound)
                    onDelete(prompt.id)
                  }}
                  title="Delete prompt"
                  aria-label="Delete prompt"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
