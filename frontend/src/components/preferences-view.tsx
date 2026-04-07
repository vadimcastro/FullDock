'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Check,
  Cloud,
  CloudOff,
  Palette,
  Bell,
  Shield,
  GripVertical,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Reorder } from 'framer-motion'
import { useSettings } from '@/hooks/use-settings'
import { ACCENT_COLORS, type AccentColor } from '@/lib/settings-types'
import { AI_MODELS, type PromptStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { playUiClickSound } from '@/lib/sound-effects'

const DEFAULT_MODEL_ORDER: string[] = ['claude', 'gemini', 'gpt', 'grok']
const DEFAULT_ENABLED_MODELS: string[] = ['claude', 'gemini', 'gpt', 'grok']
const DEFAULT_CATEGORY_ORDER: PromptStatus[] = ['on-deck', 'needs-edit', 'queued', 'forked', 'complete']
const CATEGORY_LABELS: Record<PromptStatus, string> = {
  'on-deck': 'On Deck',
  'needs-edit': 'Needs Edit',
  queued: 'Queued',
  forked: 'Forked',
  complete: 'Complete',
}

type OrderableKey = string

type SectionKey = 'appearance' | 'layout' | 'cloud' | 'privacy' | 'notifications'

function normalizeOrder<T extends OrderableKey>(order: T[] | undefined, all: T[]): T[] {
  const base = Array.isArray(order) ? order : []
  const seen = new Set<T>()
  const cleaned = base.filter((item) => all.includes(item) && !seen.has(item) && seen.add(item))
  for (const item of all) {
    if (!seen.has(item)) cleaned.push(item)
  }
  return cleaned
}

interface OrderListItem {
  key: string
  label: string
  enabled: boolean
  toggle: (checked: boolean) => void
  onRemove?: () => void
  customTitle?: string
  onCustomTitleChange?: (value: string) => void
  onCustomTitleCommit?: () => void
}

function OrderingList({
  title,
  description,
  items,
  onReorder,
  onCommit,
  reorderAxis = 'y',
}: {
  title: string
  description: string
  items: OrderListItem[]
  onReorder: (nextKeys: string[]) => void
  onCommit?: (nextKeys: string[]) => void
  reorderAxis?: 'x' | 'y'
}) {
  const keys = items.map((item) => item.key)
  const [draftKeys, setDraftKeys] = useState<string[]>(keys)
  const itemMap = new Map(items.map((item) => [item.key, item]))

  useEffect(() => {
    setDraftKeys(keys)
  }, [keys.join('|')])

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{title}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Reorder.Group
        axis={reorderAxis}
        values={draftKeys}
        onReorder={(nextKeys) => {
          setDraftKeys(nextKeys)
          onReorder(nextKeys)
        }}
        className="space-y-2"
      >
        {draftKeys.map((key) => {
          const item = itemMap.get(key)
          if (!item) return null
          return (
            <Reorder.Item
              key={item.key}
              value={item.key}
              className="rounded-md border border-border bg-card"
              onDragEnd={() => onCommit?.(draftKeys)}
            >
              <div className="flex items-center gap-2 p-2">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  {item.onCustomTitleChange ? (
                    <Input
                      value={item.customTitle ?? ''}
                      onChange={(e) => item.onCustomTitleChange?.(e.target.value)}
                      placeholder={item.label}
                      aria-label={`${item.label} tab title`}
                      className="h-8 text-xs"
                      onPointerDown={(e) => e.stopPropagation()}
                      onBlur={() => item.onCustomTitleCommit?.()}
                    />
                  ) : (
                    <p className="text-sm">{item.label}</p>
                  )}
                </div>
                <button
                  type="button"
                  className={cn(
                    'h-8 px-3 rounded-md border text-xs font-medium whitespace-nowrap transition-colors',
                    item.enabled
                      ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary hover:text-white'
                      : 'border-muted-foreground/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                  )}
                  onClick={() => item.toggle(!item.enabled)}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {item.enabled ? 'On' : 'Off'}
                </button>
                {item.onRemove ? (
                  <button
                    type="button"
                    className="h-8 px-3 rounded-md border border-destructive/50 text-destructive text-xs font-medium whitespace-nowrap transition-colors hover:bg-destructive hover:text-white"
                    onClick={item.onRemove}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
    </div>
  )
}

function SettingsSection({
  id,
  openSection,
  setOpenSection,
  icon,
  title,
  description,
  children,
}: {
  id: SectionKey
  openSection: SectionKey | null
  setOpenSection: (next: SectionKey | null) => void
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  const isOpen = openSection === id

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpenSection(isOpen ? null : id)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base flex-1">{title}</CardTitle>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </button>
      {isOpen ? <CardContent className="space-y-4">{children}</CardContent> : null}
    </Card>
  )
}

export function PreferencesView() {
  const {
    settings,
    updateSettings,
    reorderModelTabs,
    reorderPromptCategories,
    updateModelTabTitle,
    cloudSync,
  } = useSettings()
  const [notificationsMessage, setNotificationsMessage] = useState<string | null>(null)
  const [newModelTabName, setNewModelTabName] = useState('')
  const [openSection, setOpenSection] = useState<SectionKey | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [modelOrderDraft, setModelOrderDraft] = useState<string[]>(settings.modelTabOrder ?? DEFAULT_MODEL_ORDER)
  const [enabledModelsDraft, setEnabledModelsDraft] = useState<string[]>(
    settings.enabledModelTabs ?? DEFAULT_ENABLED_MODELS
  )
  const [modelTitlesDraft, setModelTitlesDraft] = useState<Record<string, string>>(settings.modelTabTitles ?? {})
  const [categoryOrderDraft, setCategoryOrderDraft] = useState<PromptStatus[]>(
    settings.promptCategoryOrder ?? DEFAULT_CATEGORY_ORDER
  )
  const [enabledCategoriesDraft, setEnabledCategoriesDraft] = useState<PromptStatus[]>(
    settings.enabledPromptCategories ?? DEFAULT_CATEGORY_ORDER
  )

  useEffect(() => {
    setModelOrderDraft(settings.modelTabOrder ?? DEFAULT_MODEL_ORDER)
  }, [settings.modelTabOrder])

  useEffect(() => {
    setEnabledModelsDraft(settings.enabledModelTabs ?? DEFAULT_ENABLED_MODELS)
  }, [settings.enabledModelTabs])

  useEffect(() => {
    setModelTitlesDraft(settings.modelTabTitles ?? {})
  }, [settings.modelTabTitles])

  useEffect(() => {
    setCategoryOrderDraft(settings.promptCategoryOrder ?? DEFAULT_CATEGORY_ORDER)
  }, [settings.promptCategoryOrder])

  useEffect(() => {
    setEnabledCategoriesDraft(settings.enabledPromptCategories ?? DEFAULT_CATEGORY_ORDER)
  }, [settings.enabledPromptCategories])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!openSection) return
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpenSection(null)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openSection])

  const maybePlaySound = () => {
    if (!settings.soundEnabled) return
    playUiClickSound()
  }

  const handleNotificationsChange = async (checked: boolean) => {
    setNotificationsMessage(null)
    maybePlaySound()
    if (!checked) {
      await updateSettings({ notifications: false })
      return
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationsMessage('Notifications are not supported in this browser.')
      await updateSettings({ notifications: false })
      return
    }

    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission !== 'granted') {
      setNotificationsMessage('Notification permission was not granted.')
      await updateSettings({ notifications: false })
      return
    }

    await updateSettings({ notifications: true })
  }

  const handleSoundChange = async (checked: boolean) => {
    if (checked) {
      playUiClickSound()
    }
    await updateSettings({ soundEnabled: checked })
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  const orderedIds = normalizeOrder(modelOrderDraft, modelOrderDraft)
  const discoveredIds = normalizeOrder(
    [...enabledModelsDraft, ...Object.keys(modelTitlesDraft ?? {})],
    [...enabledModelsDraft, ...Object.keys(modelTitlesDraft ?? {})]
  )
  const extraIds = discoveredIds.filter((id) => !orderedIds.includes(id)).sort((a, b) => a.localeCompare(b))
  const modelIds = [...orderedIds, ...extraIds]
  const normalizedModelIds = modelIds.length > 0 ? modelIds : DEFAULT_MODEL_ORDER
  const orderedModelTabs = normalizeOrder(modelOrderDraft, normalizedModelIds)
  const enabledModelTabs = new Set<string>(enabledModelsDraft.filter((id) => normalizedModelIds.includes(id)))
  const orderedCategories = normalizeOrder(categoryOrderDraft, DEFAULT_CATEGORY_ORDER)
  const enabledCategories = new Set<PromptStatus>(enabledCategoriesDraft)
  const cloudStatusLabel =
    !cloudSync.isConnected
      ? 'Offline'
      : cloudSync.status === 'error'
        ? 'Error'
        : cloudSync.status === 'syncing'
          ? 'Syncing'
          : 'Connected'
  const cloudStatusClass = !cloudSync.isConnected
    ? 'bg-muted text-muted-foreground'
    : cloudSync.status === 'error'
      ? 'bg-destructive/20 text-destructive'
      : cloudSync.status === 'syncing'
        ? 'bg-warning/20 text-warning'
        : 'bg-success/20 text-success'
  const cloudStatusDetail = !cloudSync.isConnected
    ? 'Not connected'
    : cloudSync.status === 'error'
      ? `Connected as ${cloudSync.user?.email} (sync error${cloudSync.errorCode ? `: ${cloudSync.errorCode}` : ''})`
      : cloudSync.status === 'syncing'
        ? `Connected as ${cloudSync.user?.email} (syncing...)`
        : `Connected as ${cloudSync.user?.email}`

  const addModelTab = async () => {
    const title = newModelTabName.trim()
    if (!title) return

    const existingIds = new Set<string>(normalizedModelIds)
    const slugBase =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24) || 'model'

    let candidate = `custom-${slugBase}`
    let i = 2
    while (existingIds.has(candidate)) {
      candidate = `custom-${slugBase}-${i}`
      i += 1
    }

    const nextOrder = [...orderedModelTabs, candidate]
    const nextEnabled = Array.from(new Set([...Array.from(enabledModelTabs), candidate]))
    const nextTitles = {
      ...(modelTitlesDraft ?? {}),
      [candidate]: title,
    }

    maybePlaySound()
    setNewModelTabName('')
    setModelOrderDraft(nextOrder)
    setEnabledModelsDraft(nextEnabled)
    setModelTitlesDraft(nextTitles)
    await reorderModelTabs(nextOrder, nextEnabled)
    await updateModelTabTitle(candidate, title)
  }

  const removeModelTab = async (id: string) => {
    const nextOrder = orderedModelTabs.filter((item) => item !== id)
    const nextEnabled = Array.from(enabledModelTabs).filter((item) => item !== id)
    const nextTitles = { ...(modelTitlesDraft ?? {}) }
    delete nextTitles[id]

    const fallbackOrder = nextOrder.length > 0 ? nextOrder : ['gpt']
    const fallbackEnabled = nextEnabled.length > 0 ? nextEnabled : ['gpt']

    setModelOrderDraft(fallbackOrder)
    setEnabledModelsDraft(fallbackEnabled)
    setModelTitlesDraft(nextTitles)
    await reorderModelTabs(fallbackOrder, fallbackEnabled)
    await updateSettings({ modelTabTitles: nextTitles })
  }

  return (
    <div ref={rootRef} className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b-2 bg-card/50 shrink-0 border-primary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Preferences</h2>
            <p className="text-xs text-muted-foreground">Customize your experience</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          <SettingsSection
            id="appearance"
            openSection={openSection}
            setOpenSection={setOpenSection}
            icon={<Palette className="h-4 w-4 text-muted-foreground" />}
            title="Appearance"
            description="Customize how On Deck looks"
          >
            <div className="space-y-3">
              <Label className="text-sm font-medium">Theme</Label>
              <RadioGroup
                value={settings.theme}
                onValueChange={async (value) => {
                  maybePlaySound()
                  await updateSettings({ theme: value as 'light' | 'dark' | 'system' })
                }}
                className="grid grid-cols-3 gap-2"
              >
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = settings.theme === option.value
                  return (
                    <Label
                      key={option.value}
                      htmlFor={`theme-${option.value}`}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all',
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <RadioGroupItem value={option.value} id={`theme-${option.value}`} className="sr-only" />
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{option.label}</span>
                    </Label>
                  )
                })}
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Accent Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {ACCENT_COLORS.map((color) => {
                  const isSelected = settings.accentColor === color.id
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={async () => {
                        maybePlaySound()
                        await updateSettings({ accentColor: color.id as AccentColor })
                      }}
                      className={cn(
                        'relative flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all',
                        isSelected ? 'bg-secondary' : 'hover:bg-secondary/50'
                      )}
                      title={color.label}
                    >
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
                          isSelected ? 'ring-foreground' : 'ring-transparent'
                        )}
                        style={{ backgroundColor: `oklch(0.7 0.15 ${color.hue})` }}
                      >
                        {isSelected ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <Check className="h-4 w-4 text-background" />
                          </div>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{color.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-scale" className="text-sm font-medium">
                  Font Size
                </Label>
                <span className="text-xs text-muted-foreground">{settings.fontScale ?? 100}%</span>
              </div>
              <input
                id="font-scale"
                type="range"
                min={85}
                max={120}
                step={1}
                value={settings.fontScale ?? 100}
                onChange={(e) => {
                  void updateSettings({ fontScale: Number(e.target.value) })
                }}
                className="w-full accent-primary"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="space-y-1">
                <Label htmlFor="prompt-titles" className="text-base font-semibold">
                  Prompt Names/Titles
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show and use prompt titles across cards and completed rows
                </p>
              </div>
              <Switch
                id="prompt-titles"
                checked={settings.showPromptTitles ?? true}
                onCheckedChange={async (checked) => {
                  maybePlaySound()
                  await updateSettings({ showPromptTitles: checked })
                }}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            id="layout"
            openSection={openSection}
            setOpenSection={setOpenSection}
            icon={<Settings className="h-4 w-4 text-muted-foreground" />}
            title="Layout & Ordering"
            description="Configure visible tabs/categories and drag to reorder"
          >
            <OrderingList
              title="Model Tabs"
              description="Toggle On/Off to show or hide. Remove permanently deletes from your tab list."
              items={orderedModelTabs.map((id) => {
                const base = AI_MODELS.find((m) => m.id === id)
                const fallback = base?.name ?? id
                const currentTitle = modelTitlesDraft?.[id] ?? fallback
                return {
                  key: id,
                  label: fallback,
                  enabled: enabledModelTabs.has(id),
                  customTitle: currentTitle,
                  onCustomTitleChange: (value: string) => {
                    setModelTitlesDraft((prev) => ({
                      ...(prev ?? {}),
                      [id]: value,
                    }))
                  },
                  onCustomTitleCommit: () => {
                    const value = (modelTitlesDraft?.[id] ?? '').trim()
                    if (!value) {
                      const fallbackTitle = base?.name ?? id
                      setModelTitlesDraft((prev) => ({
                        ...(prev ?? {}),
                        [id]: fallbackTitle,
                      }))
                      void updateModelTabTitle(id, fallbackTitle)
                      return
                    }
                    void updateModelTabTitle(id, value)
                  },
                  toggle: (checked: boolean) => {
                    const next = new Set(enabledModelTabs)
                    if (checked) {
                      next.add(id)
                    } else {
                      next.delete(id)
                      if (next.size === 0) next.add('gpt')
                    }
                    const nextEnabled = Array.from(next)
                    const nextOrder = checked
                      ? orderedModelTabs
                      : [...orderedModelTabs.filter((item) => item !== id), id]
                    setModelOrderDraft(nextOrder)
                    setEnabledModelsDraft(nextEnabled)
                    void reorderModelTabs(nextOrder, nextEnabled)
                  },
                  onRemove: () => {
                    maybePlaySound()
                    void removeModelTab(id)
                  },
                }
              })}
              onReorder={(nextKeys) => {
                const nextOrder = normalizeOrder(nextKeys, normalizedModelIds)
                setModelOrderDraft(nextOrder)
              }}
              onCommit={(nextKeys) => {
                maybePlaySound()
                const nextOrder = normalizeOrder(nextKeys, normalizedModelIds)
                setModelOrderDraft(nextOrder)
                void reorderModelTabs(nextOrder, Array.from(enabledModelTabs))
              }}
            />

            <div className="flex items-center gap-2">
              <Input
                value={newModelTabName}
                onChange={(e) => setNewModelTabName(e.target.value)}
                placeholder="Add a model tab (e.g., Sonnet)"
                className="h-8 text-xs"
              />
              <button
                type="button"
                className="h-8 px-3 rounded-md border border-success/70 bg-success/15 text-success text-xs font-semibold whitespace-nowrap transition-colors hover:bg-success hover:text-white active:bg-success/90 active:text-white disabled:opacity-50"
                disabled={!newModelTabName.trim()}
                onClick={() => {
                  void addModelTab()
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add Tab
                </span>
              </button>
            </div>

            <Separator />

            <OrderingList
              title="Prompt Categories"
              description="Toggle On/Off to show/hide sections and drag to reorder."
              items={orderedCategories.map((key) => ({
                key,
                label: CATEGORY_LABELS[key],
                enabled: enabledCategories.has(key),
                toggle: (checked: boolean) => {
                  const next = new Set(enabledCategories)
                  if (checked) {
                    next.add(key)
                  } else {
                    next.delete(key)
                    if (next.size === 0) next.add('on-deck')
                  }
                  const nextEnabled = Array.from(next) as PromptStatus[]
                  setEnabledCategoriesDraft(nextEnabled)
                  void reorderPromptCategories(orderedCategories, nextEnabled)
                },
              }))}
              onReorder={(nextKeys) => {
                const nextOrder = normalizeOrder(nextKeys as PromptStatus[], DEFAULT_CATEGORY_ORDER)
                setCategoryOrderDraft(nextOrder)
              }}
              onCommit={(nextKeys) => {
                maybePlaySound()
                const nextOrder = normalizeOrder(nextKeys as PromptStatus[], DEFAULT_CATEGORY_ORDER)
                setCategoryOrderDraft(nextOrder)
                void reorderPromptCategories(nextOrder, Array.from(enabledCategories))
              }}
            />
          </SettingsSection>

          <SettingsSection
            id="cloud"
            openSection={openSection}
            setOpenSection={setOpenSection}
            icon={
              cloudSync.isConnected ? (
                <Cloud className="h-4 w-4 text-muted-foreground" />
              ) : (
                <CloudOff className="h-4 w-4 text-muted-foreground" />
              )
            }
            title="Cloud Sync"
            description="Sync your prompts across devices"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-xs text-muted-foreground">
                  {cloudStatusDetail}
                </p>
              </div>
              <div
                className={cn('px-2 py-1 rounded-full text-xs font-medium', cloudStatusClass)}
              >
                {cloudStatusLabel}
              </div>
            </div>

            {cloudSync.lastSynced ? (
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Last synced</Label>
                <span className="text-xs text-muted-foreground">
                  {new Date(cloudSync.lastSynced).toLocaleString()}
                </span>
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection
            id="privacy"
            openSection={openSection}
            setOpenSection={setOpenSection}
            icon={<Shield className="h-4 w-4 text-muted-foreground" />}
            title="Data & Privacy"
            description="Manage your data"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save" className="text-sm font-medium">
                  Auto-save
                </Label>
                <p className="text-xs text-muted-foreground">Automatically save changes</p>
              </div>
              <Switch
                id="auto-save"
                checked={settings.autoSave ?? true}
                onCheckedChange={async (checked) => {
                  maybePlaySound()
                  await updateSettings({ autoSave: checked })
                }}
              />
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              Your prompts are stored locally on your device. Connect to cloud sync to backup and access across devices.
            </div>
          </SettingsSection>

          <SettingsSection
            id="notifications"
            openSection={openSection}
            setOpenSection={setOpenSection}
            icon={<Bell className="h-4 w-4 text-muted-foreground" />}
            title="Notifications"
            description="Manage notification preferences"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-sm font-medium">
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Get notified about prompt updates</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.notifications ?? false}
                onCheckedChange={handleNotificationsChange}
              />
            </div>
            {notificationsMessage ? <p className="text-xs text-muted-foreground">{notificationsMessage}</p> : null}
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound" className="text-sm font-medium">
                  Sound Effects
                </Label>
                <p className="text-xs text-muted-foreground">Play sounds on actions</p>
              </div>
              <Switch id="sound" checked={settings.soundEnabled ?? false} onCheckedChange={handleSoundChange} />
            </div>
          </SettingsSection>

          <div className="text-center py-4 text-xs text-muted-foreground">
            <p>On Deck v2.1.7</p>
            <p className="mt-1">AI Prompt Tracker</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
