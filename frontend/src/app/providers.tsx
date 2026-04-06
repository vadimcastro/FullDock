// src/app/providers.tsx
'use client';

import { ThemeProvider } from "next-themes";
import { AuthProvider } from '../lib/auth/AuthContext';
import { SettingsProvider } from '../hooks/use-settings';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}