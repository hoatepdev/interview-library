"use client";

import { useEffect, useState } from "react";
import { Flame, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { practiceApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useLoginDialog } from "@/contexts/login-dialog-context";

export function PracticeStreak() {
  const t = useTranslations("practice");
  const tAuth = useTranslations("auth");
  const { user, loading: authLoading } = useAuth();
  const { openDialog } = useLoginDialog();
  const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadStreak = async () => {
      try {
        const analytics = await practiceApi.getAnalytics(30);
        setStreak(analytics.streak);
      } catch (error) {
        console.error("Failed to load streak", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!streak || (streak.current === 0 && streak.longest === 0)) {
    return (
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-400 dark:text-orange-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("streak")}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {t("noStreak")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
          <Flame className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t("streak")}
          </div>
          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                {streak.current}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("currentStreak")}
              </span>
            </div>
            <div className="text-slate-300 dark:text-slate-600">|</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-700 dark:text-slate-300">
                {streak.longest}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("longestStreak")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
