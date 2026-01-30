"use client";

import { Bell, User } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { LanguageToggle } from "../ui/language-toggle";

export function Header() {
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
        <button className="flex items-center space-x-2 rounded-full p-1 pl-2 pr-4 text-gray-700 hover:bg-gray-100 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <User className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">User</span>
        </button>
      </div>
    </header>
  );
}
