// src/lib/api/protected.ts
'use client';

import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';

export const useProtectedApi = () => {
  const { access_token, refreshAccessToken } = useAuth();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchProtected = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    let currentToken = access_token;

    if (!currentToken) {
      currentToken = await refreshAccessToken();
      if (!currentToken) {
        throw new Error('No access token available');
      }
    }

    const fetchConfig: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'include' as RequestCredentials,
    };

    const response = await fetch(`${baseUrl}${endpoint}`, fetchConfig);

    if (response.status === 401) {
      currentToken = await refreshAccessToken();
      if (currentToken) {
        const retryResponse = await fetch(`${baseUrl}${endpoint}`, {
          ...fetchConfig,
          headers: {
            ...fetchConfig.headers,
            'Authorization': `Bearer ${currentToken}`,
          }
        });
        if (!retryResponse.ok) throw new Error('API request failed');
        return retryResponse.json();
      }
    }

    if (!response.ok) throw new Error('API request failed');
    return response.json();
  };

  const api = useMemo(() => ({
    fetchProtected,
    get: <T>(endpoint: string) => fetchProtected<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, data: any) => 
      fetchProtected<T>(endpoint, { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    put: <T>(endpoint: string, data: any) => 
      fetchProtected<T>(endpoint, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    patch: <T>(endpoint: string, data: any) => 
      fetchProtected<T>(endpoint, { 
        method: 'PATCH', 
        body: JSON.stringify(data) 
      }),
    delete: <T>(endpoint: string) => 
      fetchProtected<T>(endpoint, { method: 'DELETE' }),
  }), [access_token, refreshAccessToken, baseUrl]);

  return api;
};