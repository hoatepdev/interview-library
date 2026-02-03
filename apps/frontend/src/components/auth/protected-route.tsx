'use client';

import { useAuth } from '@/hooks/use-auth';
import { useLoginDialog } from '@/contexts/login-dialog-context';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback = null }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { openDialog } = useLoginDialog();

  useEffect(() => {
    if (!loading && !user) {
      openDialog();
    }
  }, [user, loading, openDialog]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
