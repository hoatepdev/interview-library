"use client";

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { LoginButton } from "@/components/auth/login-button";
import { Sparkles, Terminal, LogIn } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export interface LoginModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LoginModal({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: LoginModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;
  const t = useTranslations('auth');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <button className="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors w-full cursor-pointer">
            <LogIn
              className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white"
              aria-hidden="true"
            />
            {t('login')}
          </button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md w-[95%] p-0 overflow-hidden bg-transparent border-none shadow-2xl sm:rounded-2xl ring-0">
        <DialogTitle className="sr-only">{t('login')}</DialogTitle>

        <div className="relative w-full overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
          {/* Subtle top glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

          {/* Ambient background accent */}
          <div className="absolute -top-[100px] -right-[100px] w-[200px] h-[200px] bg-blue-500/20 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-[100px] -left-[100px] w-[200px] h-[200px] bg-purple-500/20 blur-[80px] pointer-events-none" />

          {/* Content */}
          <div className="relative px-8 py-10 flex flex-col items-center">
            {/* Header Icon */}
            <div className="relative mb-6 group">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
               <div className="relative flex items-center justify-center w-14 h-14 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <Terminal className="w-7 h-7 text-blue-600 dark:text-blue-400" />
               </div>
               <div className="absolute -top-1.5 -right-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-500 dark:text-yellow-300 animate-pulse" />
               </div>
            </div>

            {/* Typography */}
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 text-center">
              {t('welcomeBack')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8 max-w-[260px] leading-relaxed">
              {t('signInDesc')}
            </p>

            {/* Actions */}
            <div className="w-full space-y-4">
              <LoginButton />
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {t('agreement')}{' '}
                <a href="#" className="hover:text-blue-500 transition-colors">{t('terms')}</a>
                {' '}and{' '}
                <a href="#" className="hover:text-blue-500 transition-colors">{t('privacy')}</a>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
