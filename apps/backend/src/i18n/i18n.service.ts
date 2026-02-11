import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, type Locale } from '@interview-library/shared/i18n';

export type TranslationField = 'name' | 'description' | 'title' | 'content' | 'answer';

export interface TranslationValue {
  name?: string;
  description?: string;
  title?: string;
  content?: string;
  answer?: string;
}

export interface Translations {
  [lang: string]: TranslationValue;
}

@Injectable()
export class I18nService {
  /**
   * Get translated value from entity's translations column
   * Falls back to original field if translation not found
   */
  getTranslation<T extends Record<string, any>>(
    entity: T,
    field: TranslationField,
    lang: Locale = DEFAULT_LOCALE
  ): string {
    const originalValue = entity[field];
    const translations = this.getTranslations(entity);

    if (!translations || !translations[lang]) {
      return originalValue;
    }

    const translated = translations[lang][field];
    return translated || originalValue;
  }

  /**
   * Get all translations from entity
   */
  getTranslations<T extends Record<string, any>>(entity: T): Translations | null {
    const translations = entity['translations'];
    if (!translations || typeof translations !== 'object') {
      return null;
    }
    // Handle both JSONB (object) and string (parsed JSON)
    return typeof translations === 'string' ? JSON.parse(translations) : translations;
  }

  /**
   * Set translation for a specific field
   */
  setTranslation(
    translations: Translations | string | null,
    field: TranslationField,
    lang: Locale,
    value: string
  ): Translations {
    let parsed: Translations;

    if (!translations) {
      parsed = {};
    } else if (typeof translations === 'string') {
      parsed = JSON.parse(translations);
    } else {
      parsed = translations;
    }

    if (!parsed[lang]) {
      parsed[lang] = {};
    }

    parsed[lang][field] = value;

    return parsed;
  }

  /**
   * Format response with translations for API
   * Includes original (en) + requested language translation
   */
  formatResponse<T extends Record<string, any>>(
    entity: T,
    lang: Locale,
    fields: TranslationField[]
  ): Record<string, any> {
    const response: Record<string, any> = { ...entity };

    if (lang === DEFAULT_LOCALE) {
      return response; // No need for translations if default is en
    }

    const translations = this.getTranslations(entity);
    if (!translations || !translations[lang]) {
      return response; // No translation available
    }

    // Add translated fields with suffix (e.g., nameVi, titleVi)
    const translatedContent = translations[lang];
    for (const field of fields) {
      if (translatedContent[field]) {
        const suffix = this.getLangSuffix(lang);
        const translatedKey = `${field}${suffix}`;
        response[translatedKey] = translatedContent[field];
      }
    }

    return response;
  }

  private getLangSuffix(lang: Locale): string {
    const suffixes: Record<Locale, string> = {
      en: '',
      vi: 'Vi',
    };
    return suffixes[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  }
}
