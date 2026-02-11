import { getRequestConfig } from 'next-intl/server';
import { resolveLocale } from '@interview-library/shared/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const locale = resolveLocale(await requestLocale);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
