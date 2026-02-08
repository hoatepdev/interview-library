'use client';

import { useAuth } from '@/hooks/use-auth';
import { useLoginDialog } from '@/contexts/login-dialog-context';
import { useEffect, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback = null }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { openDialog } = useLoginDialog();
  const hasOpenedDialog = useRef(false);

  useEffect(() => {
    if (!loading && !user && !hasOpenedDialog.current) {
      // Capture the current URL for redirect after login
      const currentUrl = window.location.pathname + window.location.search;
      openDialog(currentUrl);
      hasOpenedDialog.current = true;
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
