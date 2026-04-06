'use client'

import { useState, useCallback } from 'react'
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
  ClipboardCopy,
} from 'lucide-react'
import type { Prompt, PromptStatus, AIModel } from '@/lib/types'
import { AI_MODELS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PromptCardProps {
  prompt: Prompt
  onUpdateStatus: (id: string, status: PromptStatus) => void
  onUpdatePrompt: (id: string, updates: Partial<Pick<Prompt, 'content' | 'notes' | 'linkedPromptId'>>) => void
  onDelete: (id: string) => void
  linkedPrompt?: Prompt
  allPrompts: Prompt[]
}

const statusConfig: Record<PromptStatus, { label: string; className: string }> = {
  'queued': { label: 'Queued', className: 'bg-muted text-muted-foreground' },
  'on-deck': { label: 'On Deck', className: 'bg-primary text-primary-foreground' },
  'needs-edit': { label: 'Needs Edit', className: 'bg-warning text-background' },
  'complete': { label: 'Complete', className: 'bg-success text-background' },
}

export function PromptCard({
  prompt,
  onUpdateStatus,
  onUpdatePrompt,
  onDelete,
  linkedPrompt,
  allPrompts,
}: PromptCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(prompt.content)
  const [editNotes, setEditNotes] = useState(prompt.notes)
  const [isExpanded, setIsExpanded] = useState(prompt.status === 'on-deck')
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [copiedLeft, setCopiedLeft] = useState(false)
  const [copiedRight, setCopiedRight] = useState(false)

  const handleCopy = useCallback(async (side: 'left' | 'right') => {
    if (!prompt.content) return
    try {
      await navigator.clipboard.writeText(prompt.content)
      if (side === 'left') {
        setCopiedLeft(true)
        setTimeout(() => setCopiedLeft(false), 2000)
      } else {
        setCopiedRight(true)
        setTimeout(() => setCopiedRight(false), 2000)
      }
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
      if (side === 'left') {
        setCopiedLeft(true)
        setTimeout(() => setCopiedLeft(false), 2000)
      } else {
        setCopiedRight(true)
        setTimeout(() => setCopiedRight(false), 2000)
      }
    }
  }, [prompt.content])

  const handleSave = () => {
    onUpdatePrompt(prompt.id, { content: editContent, notes: editNotes })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(prompt.content)
    setEditNotes(prompt.notes)
    setIsEditing(false)
  }

  const linkedModel = linkedPrompt
    ? AI_MODELS.find((m) => m.id === linkedPrompt.modelId)
    : null

  const otherModelPrompts = allPrompts.filter(
    (p) => p.modelId !== prompt.modelId && p.status !== 'complete'
  )

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        prompt.status === 'on-deck' && 'ring-2 ring-primary',
        prompt.status === 'needs-edit' && 'ring-2 ring-warning',
        prompt.status === 'complete' && 'opacity-60'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-0">
        {/* Left Copy Button */}
        <Button
          variant={copiedLeft ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'h-8 w-8 p-0 shrink-0 transition-all duration-200',
            copiedLeft && 'bg-success hover:bg-success text-background'
          )}
          onClick={() => handleCopy('left')}
          disabled={!prompt.content}
          title="Copy prompt"
        >
          {copiedLeft ? (
            <CheckCheck className="h-3.5 w-3.5" />
          ) : (
            <ClipboardCopy className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Center Content - Status Badge and Links */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
          <Badge className={cn('shrink-0', statusConfig[prompt.status].className)}>
            {statusConfig[prompt.status].label}
          </Badge>
          {linkedPrompt && linkedModel && (
            <Badge variant="outline" className="shrink-0 gap-1 text-xs">
              <Link2 className="h-3 w-3" />
              {linkedModel.name}
            </Badge>
          )}
        </div>

        {/* Right Controls - Copy Button and Expand */}
        <div className="flex items-center gap-1">
          <Button
            variant={copiedRight ? 'default' : 'secondary'}
            size="sm"
            className={cn(
              'h-8 gap-1.5 px-3 shrink-0 transition-all duration-200',
              copiedRight && 'bg-success hover:bg-success text-background'
            )}
            onClick={() => handleCopy('right')}
            disabled={!prompt.content}
          >
            {copiedRight ? (
              <>
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Copy</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
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

      <CardContent className="p-3 pt-2">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Prompt
              </label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] text-sm"
                placeholder="Enter your prompt..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Notes
              </label>
              <Textarea
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
            <div 
              className={cn(
                'text-sm leading-relaxed rounded-md p-2 bg-muted/30 border border-border/50 overflow-x-auto',
                !isExpanded && 'line-clamp-2'
              )}
            >
              <pre className="whitespace-pre-wrap break-words font-sans text-sm overflow-x-auto max-w-full">
                {prompt.content || 'No prompt content'}
              </pre>
            </div>

            {isExpanded && (
              <>
                {prompt.notes && (
                  <div className="mt-3 p-3 bg-secondary/50 rounded-md border-l-2 border-primary">
                    <p className="text-xs font-medium text-primary mb-1.5 uppercase tracking-wide">Notes</p>
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{prompt.notes}</p>
                  </div>
                )}

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

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/50">
                  {prompt.status === 'on-deck' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5 bg-success hover:bg-success/90 text-background font-medium"
                        onClick={() => onUpdateStatus(prompt.id, 'complete')}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-warning/50 text-warning hover:bg-warning/10"
                        onClick={() => onUpdateStatus(prompt.id, 'needs-edit')}
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
                      className="gap-1.5"
                      onClick={() => onUpdateStatus(prompt.id, 'on-deck')}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Ready to Retry
                    </Button>
                  )}

                  {prompt.status === 'queued' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => onUpdateStatus(prompt.id, 'on-deck')}
                    >
                      Move to On Deck
                    </Button>
                  )}

                  <div className="flex-1" />

                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowLinkPicker(!showLinkPicker)}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Link
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(prompt.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
