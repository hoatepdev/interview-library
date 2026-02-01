'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';
import { setApiLocale } from '@/lib/api';

export function ApiLocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    setApiLocale(locale);
  }, [locale]);

  return <>{children}</>;
}
