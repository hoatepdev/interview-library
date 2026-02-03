'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLoginDialog } from '@/contexts/login-dialog-context';
import { LOGIN_SUCCESS_EVENT } from '@/contexts/auth-context';

// Storage key for pending actions that survive OAuth redirect
const PENDING_ACTION_KEY = 'interview_library_pending_action';

// Global registry for post-login callbacks (survives OAuth redirect via window reference)
declare global {
  interface Window {
    __interviewLibraryCallbacks?: Record<string, () => void>;
  }
}

if (typeof window !== 'undefined') {
  window.__interviewLibraryCallbacks = window.__interviewLibraryCallbacks || {};
}

export interface PendingAction {
  action: string;
  data?: Record<string, unknown>;
}

export function useRequireAuth() {
  const { user } = useAuth();
  const { openDialog } = useLoginDialog();
  const callbackRef = useRef<(() => void) | null>(null);
  const actionNameRef = useRef<string | null>(null);

  // Listen for login success event to execute pending action
  useEffect(() => {
    const handleLoginSuccess = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Check if there's a pending action in sessionStorage (survives page reload)
      const pendingActionJson = sessionStorage.getItem(PENDING_ACTION_KEY);
      if (pendingActionJson) {
        try {
          const pendingAction: PendingAction = JSON.parse(pendingActionJson);
          sessionStorage.removeItem(PENDING_ACTION_KEY);

          // First try to use the in-memory callback if component hasn't unmounted
          if (actionNameRef.current && pendingAction.action === actionNameRef.current && callbackRef.current) {
            callbackRef.current();
            return;
          }

          // Fallback: use the global callback registry (survives page reload)
          if (typeof window !== 'undefined' && window.__interviewLibraryCallbacks) {
            const globalCallback = window.__interviewLibraryCallbacks[pendingAction.action];
            if (globalCallback) {
              globalCallback();
              // Clean up the global callback after execution
              delete window.__interviewLibraryCallbacks[pendingAction.action];
            }
          }
        } catch (e) {
          console.error('Failed to parse pending action:', e);
        }
      }
    };

    window.addEventListener(LOGIN_SUCCESS_EVENT, handleLoginSuccess);
    return () => {
      window.removeEventListener(LOGIN_SUCCESS_EVENT, handleLoginSuccess);
    };
  }, []);

  /**
   * Execute a callback only if user is authenticated.
   * If not authenticated, stores the action and opens login dialog.
   *
   * @param callback - Function to execute after login
   * @param actionName - Unique identifier for the action type (e.g., 'favorite', 'practice')
   */
  const requireAuth = useCallback(
    (callback: () => void, actionName: string) => {
      if (user) {
        // User is authenticated, execute immediately
        callback();
      } else {
        // Store callback reference and action name for post-login execution
        callbackRef.current = callback;
        actionNameRef.current = actionName;

        // Store pending action in sessionStorage (survives OAuth redirect)
        const pendingAction: PendingAction = {
          action: actionName,
        };
        sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(pendingAction));

        // Also store callback in global window object (backup for in-memory execution)
        if (typeof window !== 'undefined') {
          window.__interviewLibraryCallbacks![actionName] = callback;
        }

        // Open login dialog
        openDialog();
      }
    },
    [user, openDialog]
  );

  /**
   * Retrieve and clear pending action from sessionStorage
   */
  const getPendingAction = useCallback((): PendingAction | null => {
    const stored = sessionStorage.getItem(PENDING_ACTION_KEY);
    if (!stored) return null;
    sessionStorage.removeItem(PENDING_ACTION_KEY);
    return JSON.parse(stored) as PendingAction;
  }, []);

  return {
    requireAuth,
    getPendingAction,
    isAuthenticated: !!user,
  };
}
