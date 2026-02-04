"use client";

import { Link, usePathname } from "@/i18n/routing";
import {
  BookOpen,
  HelpCircle,
  Swords,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { nameKey: "nav.home", href: "/", icon: LayoutDashboard },
  { nameKey: "nav.topics", href: "/topics", icon: BookOpen },
  { nameKey: "nav.questions", href: "/questions", icon: HelpCircle },
  { nameKey: "nav.practice", href: "/practice", icon: Swords },
];

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-white/5 transition-colors duration-500 z-10">
      <div className="flex h-16 items-center px-6 font-bold text-xl tracking-wider border-b border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-white">
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
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                isActive
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )}
                aria-hidden="true"
              />
              {t(item.nameKey)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200/60 dark:border-white/5 p-4 space-y-2">
        <Link
          href="/settings"
          className="group flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Settings
            className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
            aria-hidden="true"
          />
          {t("nav.settings")}
        </Link>
      </div>
    </div>
  );
}
