'use client';

const REDIRECT_STORAGE_KEY = 'auth_redirect_url';

/**
 * Save the current URL to sessionStorage for redirect after login
 */
export function saveRedirectUrl(url: string): void {
  if (typeof window !== 'undefined' && window.sessionStorage && isValidRedirectUrl(url)) {
    sessionStorage.setItem(REDIRECT_STORAGE_KEY, url);
  }
}

/**
 * Get the saved redirect URL from sessionStorage and clear it
 */
export function getRedirectUrl(): string | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const url = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    return url;
  }
  return null;
}

/**
 * Validate if a URL is safe to redirect to (prevents open redirect attacks)
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    // Allow relative URLs starting with /
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }
    // Check if URL is from same origin
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.origin === window.location.origin;
  } catch {
    return false;
  }
}
