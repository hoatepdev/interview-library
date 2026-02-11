'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export function ApiLocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    // Store locale in sessionStorage so API client can read it
    sessionStorage.setItem('i18n_locale', locale);
  }, [locale]);

  return <>{children}</>;
}
