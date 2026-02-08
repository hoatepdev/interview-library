"use client";

import { Bell, LogIn } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { LanguageToggle } from "../ui/language-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLoginDialog } from "@/contexts/login-dialog-context";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { MobileNav } from "./MobileNav";

// ... existing imports ...

// Page title mapping configuration (using canonical English paths)
const PAGE_TITLE_MAP: Record<string, string> = {
  "/": "nav.home",
  "/topics": "topics.title",
  "/questions": "questions.title",
  "/practice": "practice.title",
};

// Reverse mapping of localized paths to canonical paths
const LOCALIZED_TO_CANONICAL: Record<string, Record<string, string>> = {
  vi: {
    "/chu-de": "/topics",
    "/cau-hoi": "/questions",
    "/luyen-tap": "/practice",
  },
  en: {
    "/topics": "/topics",
    "/questions": "/questions",
    "/practice": "/practice",
  },
};

// Dynamic route patterns and their title keys
const DYNAMIC_ROUTE_PATTERNS: Array<{
  pattern: RegExp;
  getTitle: (params: string[]) => string;
}> = [
  {
    pattern: /^\/topics\/([^/]+)$/,
    getTitle: () => "topics.title",
  },
  {
    pattern: /^\/questions\/([^/]+)$/,
    getTitle: () => "questions.title",
  },
];

export function Header() {
  const { user, loading } = useAuth();
  const { openDialog } = useLoginDialog();
  const t = useTranslations('auth');
  const tNav = useTranslations();
  const pathname = usePathname();

  // Get current page title based on pathname
  const pageTitle = useMemo(() => {
    // Extract locale from pathname (e.g., /en/home -> en)
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : 'en';

    // Remove locale from pathname (e.g., /en/home -> /home)
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
    const normalizedPath = pathWithoutLocale === '' ? '/' : pathWithoutLocale;

    // Map localized path to canonical path
    const localeMappings = LOCALIZED_TO_CANONICAL[locale] || LOCALIZED_TO_CANONICAL['en'];
    const canonicalPath = localeMappings[normalizedPath] || normalizedPath;

    // Check static routes first
    const titleKey = PAGE_TITLE_MAP[canonicalPath];
    if (titleKey) {
      return tNav(titleKey);
    }

    // Check dynamic routes (using canonical path)
    for (const { pattern, getTitle } of DYNAMIC_ROUTE_PATTERNS) {
      const match = canonicalPath.match(pattern);
      if (match) {
        return tNav(getTitle(match.slice(1)));
      }
    }

    // Fallback to home
    return tNav("nav.home");
  }, [pathname, tNav]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 md:px-6 backdrop-blur-xl transition-colors duration-500 dark:border-white/5 dark:bg-slate-900/80">
      <div className="flex items-center">
        <MobileNav />
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-none">{pageTitle}</h1>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="hidden md:flex items-center space-x-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        {user && <button className="flex items-center rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
        </button>}
        <div className="w-10 md:w-auto">
          {loading ? (
            <></>
          ) : user ? (
            <UserMenu />
          ) : (
            <button
              onClick={() => openDialog()}
              className="flex items-center rounded-full p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer"
            >
              <LogIn className="h-5 w-5" />
              <span className="ml-0 md:ml-2 text-sm font-medium hidden sm:inline">{t('login') || 'Login'}</span>
            </button>
          )}
        </div>
          
      </div>
    </header>
  );
}
