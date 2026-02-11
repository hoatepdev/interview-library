# @interview-library/shared

Shared types, utilities, and configurations for the Interview Library monorepo.

## Contents

### i18n Module

Single source of truth for internationalization configuration.

#### Usage

```typescript
import { LOCALES, DEFAULT_LOCALE, LOCALE_CONFIG, type Locale } from '@interview-library/shared/i18n';

// Validate locale
import { isValidLocale, resolveLocale } from '@interview-library/shared/i18n';

if (isValidLocale('en')) {
  // ... do something
}

const locale = resolveLocale(userInput); // Returns valid locale or DEFAULT_LOCALE
```

#### Adding a New Language

1. Edit `src/i18n/locales.ts`
2. Add locale code to `LOCALES` array (e.g., `'ja'`)
3. Add configuration to `LOCALE_CONFIG`
4. Create translation files in frontend `src/messages/{locale}.json`
5. Both frontend and backend will automatically recognize the new locale!

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev
```
