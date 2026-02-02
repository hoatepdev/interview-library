"use client";

import { useEffect, useState } from "react";
import { practiceApi } from "@/lib/api";
import { PracticeStats } from "@/types";
import { useTranslations } from "next-intl";
import { BarChart3, Clock, Target, TrendingUp } from "lucide-react";

export function PracticeStatsComponent() {
  const t = useTranslations("practice");
  const tStats = useTranslations("stats");
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

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
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col space-y-5">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        {tStats("overallStats")}
      </h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-medium mb-1">
            <Target className="w-3 h-3" />
            {t("questionsReviewed")}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalPracticeSessions}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium mb-1">
            <TrendingUp className="w-3 h-3" />
            {t("accuracy")}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{accuracy}%</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-medium mb-1">
            <Clock className="w-3 h-3" />
            {t("timeSpent")}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatTime(stats.totalPracticeTimeMinutes)}</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-medium mb-1">
            <Target className="w-3 h-3" />
            {tStats("needsReview")}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.questionsNeedingReview}</div>
        </div>
      </div>

      {/* Questions by Status */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{tStats("byStatus")}</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">{t("statuses.new")}</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">{stats.questionsByStatus?.new || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">{t("statuses.learning")}</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">{stats.questionsByStatus?.learning || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">{t("statuses.mastered")}</span>
            </div>
            <span className="font-medium text-green-600 dark:text-green-400">{stats.questionsByStatus?.mastered || 0}</span>
          </div>
        </div>
      </div>

      {/* Ratings Distribution */}
      {stats.practiceByRating && Object.keys(stats.practiceByRating).length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{tStats("byRating")}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-red-500 dark:text-red-400">😕 {t("ratings.poor")}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.practiceByRating.poor || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-orange-500 dark:text-orange-400">😐 {t("ratings.fair")}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.practiceByRating.fair || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-500 dark:text-yellow-400">😊 {t("ratings.good")}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.practiceByRating.good || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-500 dark:text-green-400">🌟 {t("ratings.great")}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{stats.practiceByRating.great || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
