'use client';

import { useAuth } from './AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/');
      } else {
        setShouldRender(true);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}