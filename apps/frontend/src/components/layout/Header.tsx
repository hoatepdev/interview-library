"use client";

import { Bell, LogIn } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { LanguageToggle } from "../ui/language-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth');

  // Get locale from pathname (e.g., '/en/dashboard' -> 'en')
  const locale = pathname.split('/')[1] || 'en';

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <LanguageToggle />
        <ThemeToggle />
        <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        {loading ? (
          <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : user ? (
          <UserMenu />
        ) : (
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="flex items-center space-x-2 rounded-full px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <LogIn className="h-5 w-5" />
            <span className="text-sm font-medium">{t('login') || 'Login'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
