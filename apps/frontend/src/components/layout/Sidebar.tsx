"use client";

import { Link, usePathname } from "@/i18n/routing";
import { BookOpen, HelpCircle, Swords, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

const navigation = [
  { nameKey: "nav.home", href: "/", icon: LayoutDashboard },
  { nameKey: "nav.topics", href: "/topics", icon: BookOpen },
  { nameKey: "nav.questions", href: "/questions", icon: HelpCircle },
  { nameKey: "nav.practice", href: "/practice", icon: Swords },
];

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="flex h-16 items-center px-6 font-bold text-xl tracking-wider border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
        INTERVIEW<span className="text-blue-500">LIB</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.nameKey}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-white"
                  : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white"
                )}
                aria-hidden="true"
              />
              {t(item.nameKey)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <Link
          href="/settings"
          className="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Settings
            className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white"
            aria-hidden="true"
          />
          {t('nav.settings')}
        </Link>
      </div>
    </div>
  );
}
