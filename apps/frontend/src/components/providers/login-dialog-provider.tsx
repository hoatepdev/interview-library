'use client';

import { LoginDialogProvider as DialogProvider } from '@/contexts/login-dialog-context';
import { LoginModal } from '@/components/auth/LoginModal';
import { useLoginDialog } from '@/contexts/login-dialog-context';

function LoginDialogWrapper() {
  const { open, closeDialog } = useLoginDialog();
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
