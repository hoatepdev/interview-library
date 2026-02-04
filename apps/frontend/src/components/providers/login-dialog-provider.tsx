'use client';

import { LoginDialogProvider as DialogProvider } from '@/contexts/login-dialog-context';
import { LoginModal } from '@/components/auth/LoginModal';
import { useLoginDialog } from '@/contexts/login-dialog-context';
import { useEffect, useState } from 'react';

function LoginDialogWrapper({ children }: { children: React.ReactNode }) {
  const { open, closeDialog } = useLoginDialog();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <LoginModal open={open} onOpenChange={closeDialog} />
    </>
  );
}

export function LoginDialogProvider({ children }: { children: React.ReactNode }) {
  return (
    <DialogProvider>
      <LoginDialogWrapper>{children}</LoginDialogWrapper>
    </DialogProvider>
  );
}
