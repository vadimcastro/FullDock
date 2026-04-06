'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Settings, Sun, Moon, Monitor, Check } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { ACCENT_COLORS, type AccentColor } from '@/lib/settings-types'
import { cn } from '@/lib/utils'

export function SettingsModal() {
  const [open, setOpen] = useState(false)
  const { settings, updateSettings } = useSettings()

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your On Deck experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Selection */}
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
                    htmlFor={option.value}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
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
                    type="button"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
