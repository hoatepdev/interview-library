import { LOCALES, DEFAULT_LOCALE, type Locale } from './locales';

/**
 * Type guard to check if a value is a valid locale
 */
export function isValidLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale);
}

/**
 * Resolve and validate a locale string, returning default if invalid
 */
export function resolveLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  return isValidLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Parse Accept-Language header and return best matching locale
 */
export function parseAcceptLanguage(header?: string): Locale | null {
  if (!header) return null;

  const languages = header
    .split(',')
    .map((lang) => {
      const [code, q] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0].toLowerCase(),
        priority: parseFloat(q || '1'),
      };
    })
    .sort((a, b) => b.priority - a.priority);

  for (const lang of languages) {
    if (isValidLocale(lang.code)) {
      return lang.code;
    }
  }

  return null;
}
