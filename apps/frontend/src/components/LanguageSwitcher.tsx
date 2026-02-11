"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTransition } from 'react';
import { Languages, Check } from 'lucide-react';
import { LOCALE_LIST } from '@interview-library/shared/i18n';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className="relative group z-50">
      <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-800/70 hover:border-blue-500/30 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] cursor-pointer">
        <Languages className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {LOCALE_LIST.find(l => l.code === locale)?.code.toUpperCase()}
        </span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-48 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 p-2 overflow-hidden">
        {LOCALE_LIST.map((loc) => (
          <button
            key={loc.code}
            onClick={() => handleLocaleChange(loc.code)}
            disabled={isPending}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
              locale === loc.code
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg leading-none">{loc.flag}</span>
              <span>{loc.name}</span>
            </div>
            {locale === loc.code && (
              <Check className="w-4 h-4 text-blue-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
