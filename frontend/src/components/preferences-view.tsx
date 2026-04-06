'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Sun, Moon, Monitor, Check, Cloud, CloudOff, Palette, Bell, Shield } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { ACCENT_COLORS, type AccentColor } from '@/lib/settings-types'
import { cn } from '@/lib/utils'

export function PreferencesView() {
  const { settings, updateSettings, cloudSync } = useSettings()

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 bg-card/50 shrink-0 border-primary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Preferences</h2>
            <p className="text-xs text-muted-foreground">
              Customize your experience
            </p>
          </div>
        </div>
      </div>

      {/* Settings Content - Vertical scrolling */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Theme Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Appearance</CardTitle>
              </div>
              <CardDescription>Customize how On Deck looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Theme</Label>
                <RadioGroup
                  value={settings.theme}
                  onValueChange={(value) =>
                    updateSettings({ theme: value as 'light' | 'dark' | 'system' })
                  }
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
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`theme-${option.value}`}
                          className="sr-only"
                        />
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </Label>
                    )
                  })}
                </RadioGroup>
              </div>

              <Separator />

              {/* Accent Color Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Accent Color</Label>
                <div className="grid grid-cols-5 gap-2">
                  {ACCENT_COLORS.map((color) => {
                    const isSelected = settings.accentColor === color.id
                    return (
                      <button
                        key={color.id}
                        onClick={() =>
                          updateSettings({ accentColor: color.id as AccentColor })
                        }
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
                          style={{
                            backgroundColor: `oklch(0.7 0.15 ${color.hue})`,
                          }}
                        >
                          {isSelected && (
                            <div className="flex h-full w-full items-center justify-center">
                              <Check className="h-4 w-4 text-background" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {color.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cloud Sync */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {cloudSync.isConnected ? (
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <CloudOff className="h-4 w-4 text-muted-foreground" />
                )}
                <CardTitle className="text-base">Cloud Sync</CardTitle>
              </div>
              <CardDescription>
                Sync your prompts across devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-xs text-muted-foreground">
                    {cloudSync.isConnected 
                      ? `Connected as ${cloudSync.user?.email}` 
                      : 'Not connected'}
                  </p>
                </div>
                <div className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  cloudSync.isConnected 
                    ? 'bg-success/20 text-success' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  {cloudSync.isConnected ? 'Connected' : 'Offline'}
                </div>
              </div>
              
              {cloudSync.lastSynced && (
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Last synced</Label>
                  <span className="text-xs text-muted-foreground">
                    {new Date(cloudSync.lastSynced).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Notifications</CardTitle>
              </div>
              <CardDescription>Manage notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications" className="text-sm font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about prompt updates
                  </p>
                </div>
                <Switch 
                  id="push-notifications" 
                  checked={settings.notifications ?? false}
                  onCheckedChange={(checked) => updateSettings({ notifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound" className="text-sm font-medium">
                    Sound Effects
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Play sounds on actions
                  </p>
                </div>
                <Switch 
                  id="sound" 
                  checked={settings.soundEnabled ?? false}
                  onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Data & Privacy</CardTitle>
              </div>
              <CardDescription>Manage your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save" className="text-sm font-medium">
                    Auto-save
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save changes
                  </p>
                </div>
                <Switch 
                  id="auto-save" 
                  checked={settings.autoSave ?? true}
                  onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                />
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                Your prompts are stored locally on your device. Connect to cloud sync to backup and access across devices.
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <div className="text-center py-4 text-xs text-muted-foreground">
            <p>On Deck v1.0.0</p>
            <p className="mt-1">AI Prompt Tracker</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
