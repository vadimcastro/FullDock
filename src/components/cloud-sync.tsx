'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  User,
  AlertCircle,
  Check,
} from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'

function formatLastSynced(timestamp: number | null): string {
  if (!timestamp) return 'Never'
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}

function SyncStatusIndicator() {
  const { syncState } = useSettings()

  const statusConfig = {
    synced: { icon: Cloud, label: 'Synced', className: 'text-success' },
    syncing: { icon: RefreshCw, label: 'Syncing...', className: 'text-primary animate-spin' },
    offline: { icon: CloudOff, label: 'Offline', className: 'text-muted-foreground' },
    error: { icon: AlertCircle, label: 'Sync Error', className: 'text-destructive' },
  }

  const config = statusConfig[syncState.status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn('h-3.5 w-3.5', config.className)} />
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {config.label}
      </span>
    </div>
  )
}

function AuthModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { signIn } = useSettings()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock authentication - replace with actual auth
    signIn()
    onOpenChange(false)
    setEmail('')
    setPassword('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create Account' : 'Sign In'}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? 'Create an account to sync your prompts across devices'
              : 'Sign in to access your synced prompts'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CloudSyncButton() {
  const { syncState, triggerSync, signOut } = useSettings()
  const [authOpen, setAuthOpen] = useState(false)

  if (!syncState.isAuthenticated) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setAuthOpen(true)}
        >
          <CloudOff className="h-3.5 w-3.5" />
          <span className="text-xs hidden sm:inline">Connect</span>
        </Button>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
        >
          <SyncStatusIndicator />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {syncState.userEmail}
              </p>
              <p className="text-xs text-muted-foreground">
                Last synced: {formatLastSynced(syncState.lastSynced)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Sync Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {syncState.status === 'synced' && (
                <Check className="h-4 w-4 text-success" />
              )}
              {syncState.status === 'syncing' && (
                <RefreshCw className="h-4 w-4 text-primary animate-spin" />
              )}
              {syncState.status === 'error' && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm">
                {syncState.status === 'synced' && 'All changes synced'}
                {syncState.status === 'syncing' && 'Syncing...'}
                {syncState.status === 'error' && 'Sync failed'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={triggerSync}
              disabled={syncState.status === 'syncing'}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  syncState.status === 'syncing' && 'animate-spin'
                )}
              />
            </Button>
          </div>

          <Separator />

          {/* Sign Out */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
