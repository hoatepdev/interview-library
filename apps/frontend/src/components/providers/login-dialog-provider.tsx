'use client';

import { useEffect } from 'react';
import { LoginDialogProvider as DialogProvider } from '@/contexts/login-dialog-context';
import { LoginModal } from '@/components/auth/LoginModal';
import { useLoginDialog } from '@/contexts/login-dialog-context';
import { LOGIN_SUCCESS_EVENT } from '@/contexts/auth-context';

function LoginDialogWrapper() {
  const { open, closeDialog } = useLoginDialog();

  // Close dialog after successful login
  useEffect(() => {
    const handleLoginSuccess = () => {
      if (open) {
        closeDialog();
      }
    };

    window.addEventListener(LOGIN_SUCCESS_EVENT, handleLoginSuccess);
    return () => {
      window.removeEventListener(LOGIN_SUCCESS_EVENT, handleLoginSuccess);
    };
  }, [open, closeDialog]);

  return <LoginModal open={open} onOpenChange={closeDialog} />;
}

export function LoginDialogProvider({ children }: { children: React.ReactNode }) {
  return (
    <DialogProvider>
      {children}
      <LoginDialogWrapper />
    </DialogProvider>
  );
}
