"use client";

import { Link, usePathname } from "@/navigation";
import { BookOpen, HelpCircle, Swords, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Topics", href: "/topics", icon: BookOpen },
  { name: "Questions", href: "/questions", icon: HelpCircle },
  { name: "Practice", href: "/practice", icon: Swords },
];

export function Sidebar() {
  const pathname = usePathname();

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
              key={item.name}
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
              {item.name}
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
          Settings
        </Link>
      </div>
    </div>
  );
}
