// src/app/providers.tsx
'use client'

import React from 'react'
import { AuthProvider } from '../lib/auth/AuthContext'
import { SettingsProvider } from '../hooks/use-settings'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </AuthProvider>
  )
}