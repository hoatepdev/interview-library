'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { saveRedirectUrl } from '@/lib/redirect';

interface LoginDialogContextType {
  open: boolean;
  openDialog: (redirectUrl?: string) => void;
  closeDialog: () => void;
}

const LoginDialogContext = createContext<LoginDialogContextType>({
  open: false,
  openDialog: () => {},
  closeDialog: () => {},
});

export function LoginDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openDialog = useCallback((url?: string) => {
    setOpen(true);
    // Capture current URL for redirect after login and save to sessionStorage
    const currentPath = typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : null;
    saveRedirectUrl(url || currentPath || '');
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <LoginDialogContext.Provider value={{ open, openDialog, closeDialog }}>
      {children}
    </LoginDialogContext.Provider>
  );
}

export function useLoginDialog() {
  const context = useContext(LoginDialogContext);
  if (!context) {
    throw new Error('useLoginDialog must be used within LoginDialogProvider');
  }
  return context;
}
