"use client";

import { Bell, LogIn } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { LanguageToggle } from "../ui/language-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLoginDialog } from "@/contexts/login-dialog-context";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

// Page title mapping configuration
const PAGE_TITLE_MAP: Record<string, string> = {
  "/": "nav.home",
  "/topics": "topics.title",
  "/questions": "questions.title",
  "/practice": "practice.title",
};

export function Header() {
  const { user, loading } = useAuth();
  const { openDialog } = useLoginDialog();
  const t = useTranslations('auth');
  const tNav = useTranslations();
  const pathname = usePathname();

  // Get current page title based on pathname
  const getPageTitle = () => {
    // Remove locale from pathname (e.g., /en/home -> /home)
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
    const normalizedPath = pathWithoutLocale === '' ? '/' : pathWithoutLocale;

    const titleKey = PAGE_TITLE_MAP[normalizedPath];
    return titleKey ? tNav(titleKey) : "Dashboard";
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-xl transition-colors duration-500 dark:border-white/5 dark:bg-slate-900/80">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <LanguageToggle />
        <ThemeToggle />
        <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
        </button>
        {loading ? (
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ) : user ? (
          <UserMenu />
        ) : (
          <button
            onClick={openDialog}
            className="flex items-center space-x-2 rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span className="text-sm font-medium">{t('login') || 'Login'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
