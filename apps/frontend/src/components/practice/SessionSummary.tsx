"use client";

import { Trophy, Target, Clock, TrendingUp, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SelfRating } from "@/types";

export interface SessionResult {
  questionId: string;
  questionTitle: string;
  rating: SelfRating;
  timeSpentSeconds: number;
}

interface SessionSummaryProps {
  results: SessionResult[];
  duration: number; // total seconds
  onNewSession: () => void;
  onExit: () => void;
}

const ratingColorMap: Record<string, string> = {
  poor: "text-red-500",
  fair: "text-orange-500",
  good: "text-yellow-500",
  great: "text-green-500",
};

export function SessionSummary({
  results,
  duration,
  onNewSession,
  onExit,
}: SessionSummaryProps) {
  const t = useTranslations("practice");

  const totalQuestions = results.length;
  const positiveCount = results.filter(
    (r) => r.rating === SelfRating.GOOD || r.rating === SelfRating.GREAT,
  ).length;
  const accuracy =
    totalQuestions > 0 ? Math.round((positiveCount / totalQuestions) * 100) : 0;
  const avgTime =
    totalQuestions > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.timeSpentSeconds, 0) /
            totalQuestions,
        )
      : 0;

  const ratingCounts = results.reduce(
    (acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}m`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t("sessionComplete")}
        </h2>

        <div className="grid grid-cols-3 gap-4 mt-6 mb-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalQuestions}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t("questionsAnswered")}
            </div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {accuracy}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t("sessionAccuracy")}
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
            <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {avgTime > 0 ? `${avgTime}s` : "—"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t("avgTimePerQuestion")}
            </div>
          </div>
        </div>

        {/* Rating breakdown */}
        {Object.keys(ratingCounts).length > 0 && (
          <div className="flex justify-center gap-4 mb-6 text-sm">
            {Object.entries(ratingCounts).map(([rating, count]) => (
              <div key={rating} className="flex items-center gap-1">
                <span className={`font-medium ${ratingColorMap[rating] || ""}`}>
                  {t(`ratings.${rating}`)}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={onNewSession}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {t("newSession")}
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            {t("exitSession")}
          </button>
        </div>
      </div>
    </div>
  );
}
