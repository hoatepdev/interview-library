import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

declare global {
  namespace Express {
    interface Request {
      i18n?: {
        lang: SupportedLanguage;
        acceptLanguage: string;
      };
    }
  }
}

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const lang = this.detectLanguage(req);
    req.i18n = {
      lang,
      acceptLanguage: req.headers['accept-language'] || 'en',
    };
    next();
  }

  private detectLanguage(req: Request): SupportedLanguage {
    // 1. Check query param (?lang=vi)
    const queryLang = this.extractLang(req.query.lang);
    if (queryLang) return queryLang;

    // 2. Check Accept-Language header
    const headerLang = this.parseAcceptLanguage(req.headers['accept-language']);
    if (headerLang) return headerLang;

    // 3. Fallback to default
    return DEFAULT_LANGUAGE;
  }

  private extractLang(value: any): SupportedLanguage | null {
    if (!value) return null;
    const lang = String(value).toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
      return lang as SupportedLanguage;
    }
    return null;
  }

  private parseAcceptLanguage(header: string | undefined): SupportedLanguage | null {
    if (!header) return null;

    // Parse Accept-Language header: "vi-VN,vi;q=0.9,en;q=0.8"
    const languages = header.split(',').map(lang => {
      const [code, q] = lang.trim().split(';q=');
      return { code: code.split('-')[0], priority: parseFloat(q || '1') };
    }).sort((a, b) => b.priority - a.priority);

    for (const lang of languages) {
      if (SUPPORTED_LANGUAGES.includes(lang.code as SupportedLanguage)) {
        return lang.code as SupportedLanguage;
      }
    }

    return null;
  }
}

// Functional middleware for use in modules
export const i18nMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const middleware = new I18nMiddleware();
  middleware.use(req, res, next);
};
