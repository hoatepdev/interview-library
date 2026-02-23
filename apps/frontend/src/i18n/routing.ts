import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { LOCALES, DEFAULT_LOCALE } from '@interview-library/shared/i18n';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: [...LOCALES],

  // Used when no locale matches
  defaultLocale: DEFAULT_LOCALE,

  // The `pathnames` object holds the mappings of internal route paths
  // to their localized pathnames (optional, can be omitted)
  pathnames: {
    '/': '/',
    '/topics': {
      en: '/topics',
      vi: '/chu-de'
    },
    '/questions': {
      en: '/questions',
      vi: '/cau-hoi'
    },
    '/practice': {
      en: '/practice',
      vi: '/luyen-tap'
    },
    '/settings': '/settings',
    '/history': '/history',
    '/analytics': {
      en: '/analytics',
      vi: '/phan-tich'
    }
  }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
