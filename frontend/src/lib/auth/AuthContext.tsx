// src/lib/auth/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

export interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  role?: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface AuthContextType {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [access_token, setAccessToken] = useState<string | null>(null);
  const [refresh_token, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!access_token && !!user;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const useSecureCookies =
    typeof window !== 'undefined' && window.location.protocol === 'https:';

  const fetchUser = useCallback(async (token: string) => {
    try {
      console.log('Fetching user with token...', token.substring(0, 10));
      
      const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        if (response.status === 401) {
          Cookies.remove('access_token');
          setAccessToken(null);
        }
        throw new Error(`Failed to fetch user: ${errorText}`);
      }

      const userData = await response.json();
      console.log('User data received:', userData);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Error in fetchUser:', error);
      return false;
    }
  }, [useSecureCookies]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const storedRefreshToken = Cookies.get('refresh_token') || refresh_token;
      if (!storedRefreshToken) {
        return null;
      }

      const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
        credentials: 'include',
        mode: 'cors',
      });

      if (!response.ok) {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        setAccessToken(null);
        setRefreshToken(null);
        return null;
      }

      const data = await response.json();
      const nextAccessToken = data.access_token as string;
      const nextRefreshToken = data.refresh_token as string;

      Cookies.set('access_token', nextAccessToken, {
        expires: 1,
        path: '/',
        secure: useSecureCookies,
        sameSite: useSecureCookies ? 'strict' : 'lax'
      });
      Cookies.set('refresh_token', nextRefreshToken, {
        expires: 14,
        path: '/',
        secure: useSecureCookies,
        sameSite: useSecureCookies ? 'strict' : 'lax'
      });
      setAccessToken(nextAccessToken);
      setRefreshToken(nextRefreshToken);
      return nextAccessToken;
    } catch (error) {
      console.error('Refresh token error:', error);
      return null;
    }
  }, [refresh_token, useSecureCookies]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting login to:', process.env.NEXT_PUBLIC_API_URL);
      
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }).toString(),
        credentials: 'include',
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Login failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData || 'Login failed');
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token;
      
      Cookies.set('access_token', newAccessToken, { 
        expires: 1,
        path: '/',
        secure: useSecureCookies,
        sameSite: useSecureCookies ? 'strict' : 'lax'
      });
      Cookies.set('refresh_token', newRefreshToken, {
        expires: 14,
        path: '/',
        secure: useSecureCookies,
        sameSite: useSecureCookies ? 'strict' : 'lax'
      });
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      const userFetched = await fetchUser(newAccessToken);
      if (!userFetched) {
        throw new Error('Failed to fetch user data after login');
      }
      
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred during login');
      }
    }
  }, [fetchUser, router, useSecureCookies]);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
        mode: 'cors',
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Registration failed');
      }
      
      const data = await response.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token;
      
      Cookies.set('access_token', newAccessToken, { 
        expires: 1,
        path: '/',
        secure: useSecureCookies,
        sameSite: useSecureCookies ? 'strict' : 'lax'
      });
      Cookies.set('refresh_token', newRefreshToken, {
        expires: 14,
        path: '/',
        secure: useSecureCookies,
        sameSite: useSecureCookies ? 'strict' : 'lax'
      });
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      
      const userFetched = await fetchUser(newAccessToken);
      if (!userFetched) {
        throw new Error('Failed to fetch user data after registration');
      }
      
      router.push('/');
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred during registration');
      }
    }
  }, [fetchUser, router, useSecureCookies]);

  const logout = useCallback(() => {
    const storedRefreshToken = Cookies.get('refresh_token') || refresh_token;
    if (storedRefreshToken) {
      fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
        credentials: 'include',
        mode: 'cors',
      }).catch((error) => console.error('Logout API error:', error));
    }
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    router.push('/');
  }, [refresh_token, router]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Handle OAuth tokens from URL
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const urlAccessToken = params.get('access_token');
          const urlRefreshToken = params.get('refresh_token');

          if (urlAccessToken && urlRefreshToken) {
            console.log('OAuth tokens detected in URL, persisting...');
            
            Cookies.set('access_token', urlAccessToken, { 
              expires: 1,
              path: '/',
              secure: useSecureCookies,
              sameSite: useSecureCookies ? 'strict' : 'lax'
            });
            Cookies.set('refresh_token', urlRefreshToken, {
              expires: 14,
              path: '/',
              secure: useSecureCookies,
              sameSite: useSecureCookies ? 'strict' : 'lax'
            });

            // Remove tokens from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('access_token');
            url.searchParams.delete('refresh_token');
            window.history.replaceState({}, '', url.toString());
            
            // Set state and fetch user
            setAccessToken(urlAccessToken);
            setRefreshToken(urlRefreshToken);
            await fetchUser(urlAccessToken);
            setIsLoading(false);
            return;
          }
        }

        const storedToken = Cookies.get('access_token');
        const storedRefreshToken = Cookies.get('refresh_token');
        setRefreshToken(storedRefreshToken || null);
        
        if (storedToken) {
          setAccessToken(storedToken);
          const userFetched = await fetchUser(storedToken);
          
          if (!userFetched && pathname.startsWith('/dashboard')) {
            const refreshedAccessToken = await refreshAccessToken();
            if (refreshedAccessToken) {
              await fetchUser(refreshedAccessToken);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, fetchUser, refreshAccessToken, useSecureCookies]);

  const contextValue = useMemo(() => ({
    user,
    access_token,
    refresh_token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAccessToken,
  }), [
    user, 
    access_token, 
    refresh_token, 
    isLoading, 
    isAuthenticated, 
    login, 
    register, 
    logout, 
    refreshAccessToken
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
