'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { authApi } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Event name for login completion
export const LOGIN_SUCCESS_EVENT = 'interview_library_login_success';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  refetch: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousUserRef = useRef<User | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authApi.getProfile();
      setUser(userData);

      // Check if user just logged in (was null, now has value)
      if (!previousUserRef.current && userData) {
        // Dispatch login success event for components to handle pending actions
        window.dispatchEvent(new CustomEvent(LOGIN_SUCCESS_EVENT, { detail: userData }));
      }
      previousUserRef.current = userData;
    } catch (err: any) {
      // User is not authenticated - this is expected
      if (err.response?.status !== 401) {
        setError('Failed to fetch user profile');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refetch = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
