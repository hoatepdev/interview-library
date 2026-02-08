'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLoginDialog } from '@/contexts/login-dialog-context';

export function useRequireAuth() {
  const { user } = useAuth();
  const { openDialog } = useLoginDialog();

  /**
   * Execute a callback only if user is authenticated.
   * If not authenticated, opens login dialog.
   *
   * @param callback - Function to execute if authenticated
   */
  const requireAuth = useCallback(
    (callback: () => void) => {
      if (user) {
        // User is authenticated, execute immediately
        callback();
      } else {
        // User not authenticated, open login dialog with current URL for redirect
        const currentUrl = window.location.pathname + window.location.search;
        openDialog(currentUrl);
      }
    },
    [user, openDialog]
  );

  return {
    requireAuth,
    isAuthenticated: !!user,
  };
}
