import type { Locale } from './locales';

/**
 * Translation response with metadata
 */
export interface TranslationResponse<T = any> {
  id: string;
  locale: Locale;
  isFallback: boolean | Record<string, boolean>;
  availableLocales: Locale[];
  data: T;
}

/**
 * Translatable fields enum
 */
export type TranslationField = 'name' | 'description' | 'title' | 'content' | 'answer';
