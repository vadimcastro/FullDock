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
  const { signIn, signUp } = useSettings()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      onOpenChange(false)
      setEmail('')
      setPassword('')
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
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

        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full gap-2 font-medium border-2 text-foreground hover:text-foreground dark:text-foreground dark:hover:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/oauth/google`
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 font-medium border-2 text-foreground hover:text-foreground dark:text-foreground dark:hover:text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/oauth/github`
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                fill="currentColor"
              />
            </svg>
            Continue with GitHub
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground text-[10px]">
                Or continue with email
              </span>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CloudSyncButton() {
  const { syncState, cloudSync, triggerSync, signOut } = useSettings()
  const [authOpen, setAuthOpen] = useState(false)

  if (!cloudSync.isConnected) {
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
                {cloudSync.user?.email || syncState.userEmail}
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
