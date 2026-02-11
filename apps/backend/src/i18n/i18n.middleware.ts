import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LOCALES, DEFAULT_LOCALE, parseAcceptLanguage, isValidLocale, type Locale } from '@interview-library/shared/i18n';

declare global {
  namespace Express {
    interface Request {
      i18n?: {
        lang: Locale;
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

  private detectLanguage(req: Request): Locale {
    // 1. Check query param (?lang=vi)
    const queryLang = this.extractLang(req.query.lang);
    if (queryLang) return queryLang;

    // 2. Check Accept-Language header
    const headerLang = parseAcceptLanguage(req.headers['accept-language']);
    if (headerLang) return headerLang;

    // 3. Fallback to default
    return DEFAULT_LOCALE;
  }

  private extractLang(value: any): Locale | null {
    if (!value) return null;
    const lang = String(value).toLowerCase();
    if (isValidLocale(lang)) {
      return lang as Locale;
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
