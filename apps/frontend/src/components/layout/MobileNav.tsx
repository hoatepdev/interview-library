"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { navigation } from "./Sidebar";
import { useState } from "react";
import { ThemeToggle } from "../ui/theme-toggle";
import { LanguageToggle } from "../ui/language-toggle";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Mobile navigation menu</SheetDescription>
        <div className="flex h-16 items-center px-6 font-bold text-xl tracking-wider border-b border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-white">
          INTERVIEW<span className="text-blue-500">LIB</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.nameKey}
                href={item.href}
                onClick={() => setOpen(false)}
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


        <div className="border-t border-slate-200/60 dark:border-white/5 p-4 space-y-4 mb-4">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="group flex items-center px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Settings
              className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              aria-hidden="true"
            />
            {t("nav.settings")}
          </Link>
          
          <div className="flex items-center justify-between px-3">
             <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Appearance</div>
             <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
             </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
