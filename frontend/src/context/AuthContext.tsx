/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  subscription_tier: 'free' | 'pro';
  created_at: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'resofleur_auth';

function getStoredAuth(): { tokens: AuthTokens; user: User } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse stored auth:', e);
  }
  return null;
}

function setStoredAuth(tokens: AuthTokens, user: User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tokens, user }));
}

function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setTokens(stored.tokens);
      setUser(stored.user);
    }
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    clearStoredAuth();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokens) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setStoredAuth(tokens, userData);
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  }, [tokens]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let res: Response;
      try {
        res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      } catch (networkError) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }

      // Try to parse JSON, handle non-JSON responses gracefully
      let data: any;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (jsonError) {
          throw new Error('Server returned invalid response. Please try again.');
        }
      } else {
        // Non-JSON response (likely an error page)
        if (!res.ok) {
          throw new Error(`Server error (${res.status}). Please try again later.`);
        }
        throw new Error('Unexpected server response. Please try again.');
      }
      
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      const newTokens: AuthTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in
      };
      setTokens(newTokens);
      setUser(data.user);
      setStoredAuth(newTokens, data.user);
    } catch (e: any) {
      setError(e.message || 'Login failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let res: Response;
      try {
        res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName })
        });
      } catch (networkError) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }

      // Try to parse JSON, handle non-JSON responses gracefully
      let data: any;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (jsonError) {
          throw new Error('Server returned invalid response. Please try again.');
        }
      } else {
        // Non-JSON response (likely an error page)
        if (!res.ok) {
          throw new Error(`Server error (${res.status}). Please try again later.`);
        }
        throw new Error('Unexpected server response. Please try again.');
      }
      
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      const newTokens: AuthTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in
      };
      setTokens(newTokens);
      setUser(data.user);
      setStoredAuth(newTokens, data.user);
    } catch (e: any) {
      setError(e.message || 'Registration failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user && !!tokens,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getAuthToken(): string | null {
  const stored = getStoredAuth();
  return stored?.tokens.access_token || null;
}
