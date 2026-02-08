'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getRedirectUrl } from '@/lib/redirect';

/**
 * Handles redirect after OAuth login.
 * Checks for auth_success parameter and redirects to saved URL.
 */
export function AuthRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Check if user just returned from OAuth
    const authSuccess = searchParams.get('auth_success');

    // Only redirect when not loading and user is authenticated
    if (authSuccess && !loading && user) {
      // Get the saved redirect URL from sessionStorage
      const redirectUrl = getRedirectUrl();

      // Extract current locale from pathname (e.g., /en or /vi)
      const pathLocale = pathname.split('/')[1];
      const locale = ['en', 'vi'].includes(pathLocale) ? pathLocale : 'en';

      if (redirectUrl) {
        router.replace(redirectUrl);
      } else {
        // No saved URL, redirect to locale homepage
        router.replace(`/${locale}`);
      }
    }
  }, [searchParams, user, loading, router, pathname]);

  return null;
}
