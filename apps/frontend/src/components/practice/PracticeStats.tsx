"use client";

import { useEffect, useState } from "react";
import { practiceApi } from "@/lib/api";
import { PracticeStats } from "@/types";
import { useTranslations } from "next-intl";
import { BarChart3, Clock, Target, TrendingUp, Lock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLoginDialog } from "@/contexts/login-dialog-context";

export function PracticeStatsComponent() {
  const t = useTranslations("practice");
  const tStats = useTranslations("stats");
  const tAuth = useTranslations("auth");
  const { user, loading: authLoading } = useAuth();
  const { openDialog } = useLoginDialog();
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only load stats if user is authenticated
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        const data = await practiceApi.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  // Show loading state while checking auth
  if (authLoading || isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{tStats("overallStats")}</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{tStats("overallStats")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{tAuth("loginRequiredDesc")}</p>
          </div>
          <button
            onClick={() => openDialog()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {tAuth("login")}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{tStats("overallStats")}</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate accuracy based on good/great ratings
  const positiveRatings = (stats.practiceByRating?.good || 0) + (stats.practiceByRating?.great || 0);
  const totalRatings = stats.totalPracticeSessions || 1;
  const accuracy = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 0;

  // Format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 flex flex-col space-y-5">
      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        {tStats("overallStats")}
      </h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-3 h-3" />
            {t("questionsReviewed")}
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalPracticeSessions}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-3 h-3" />
            {t("accuracy")}
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{accuracy}%</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-3 h-3" />
            {t("timeSpent")}
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatTime(stats.totalPracticeTimeMinutes)}</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-3 h-3" />
            {tStats("needsReview")}
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stats.questionsNeedingReview}</div>
        </div>
      </div>

      {/* Questions by Status */}
      <div className="border-t border-slate-200/60 dark:border-white/5 pt-4">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{tStats("byStatus")}</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]"></div>
              <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">{t("statuses.new")}</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">{stats.questionsByStatus?.new || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
              <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">{t("statuses.learning")}</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">{stats.questionsByStatus?.learning || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">{t("statuses.mastered")}</span>
            </div>
            <span className="font-bold text-green-600 dark:text-green-400">{stats.questionsByStatus?.mastered || 0}</span>
          </div>
        </div>
      </div>

      {/* Ratings Distribution */}
      {stats.practiceByRating && Object.keys(stats.practiceByRating).length > 0 && (
        <div className="border-t border-slate-200/60 dark:border-white/5 pt-4">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{tStats("byRating")}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-red-500 dark:text-red-400 font-medium">😕 {t("ratings.poor")}</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats.practiceByRating.poor || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-orange-500 dark:text-orange-400 font-medium">😐 {t("ratings.fair")}</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats.practiceByRating.fair || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-500 dark:text-yellow-400 font-medium">😊 {t("ratings.good")}</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats.practiceByRating.good || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-500 dark:text-green-400 font-medium">🌟 {t("ratings.great")}</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats.practiceByRating.great || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
