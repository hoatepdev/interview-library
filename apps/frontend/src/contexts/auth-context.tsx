'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: string;
  role: 'user' | 'moderator' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

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

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authApi.getProfile();
      setUser(userData);
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
