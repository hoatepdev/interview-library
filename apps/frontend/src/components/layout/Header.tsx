"use client";

import { Bell, LogIn } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { LanguageToggle } from "../ui/language-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLoginDialog } from "@/contexts/login-dialog-context";

import { useTranslations } from "next-intl";

export function Header() {
  const { user, loading } = useAuth();
  const { openDialog } = useLoginDialog();
  const t = useTranslations('auth');

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-xl transition-colors duration-500 dark:border-white/5 dark:bg-slate-900/80">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <LanguageToggle />
        <ThemeToggle />
        <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        {loading ? (
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ) : user ? (
          <UserMenu />
        ) : (
          <button
            onClick={openDialog}
            className="flex items-center space-x-2 rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
          >
            <LogIn className="h-4 w-4" />
            <span className="text-sm font-medium">{t('login') || 'Login'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
