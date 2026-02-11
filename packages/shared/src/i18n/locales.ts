/**
 * ===== SINGLE SOURCE OF TRUTH FOR LOCALE CONFIGURATION =====
 *
 * To add a new language:
 * 1. Add locale code to LOCALES array (e.g., 'ja', 'ko')
 * 2. Add configuration to LOCALE_CONFIG
 * 3. Create translation files in frontend/src/messages/{locale}/
 *
 * All apps will automatically recognize the new locale!
 */

export const LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  dateTimeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

export const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    dateTimeFormat: 'MM/DD/YYYY HH:mm',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
  },
};

export const LOCALE_LIST = Object.values(LOCALE_CONFIG);
