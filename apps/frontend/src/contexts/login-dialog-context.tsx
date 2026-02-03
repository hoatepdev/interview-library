'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoginDialogContextType {
  open: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

const LoginDialogContext = createContext<LoginDialogContextType>({
  open: false,
  openDialog: () => {},
  closeDialog: () => {},
});

export function LoginDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openDialog = () => setOpen(true);
  const closeDialog = () => setOpen(false);

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
