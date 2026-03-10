"use client";

import { Pause, Play, Square } from "lucide-react";
import { useTranslations } from "next-intl";

interface TimerBarProps {
  remaining: number; // seconds
  total: number; // seconds
  isPaused: boolean;
  onPause: () => void;
  onStop: () => void;
}

export function TimerBar({
  remaining,
  total,
  isPaused,
  onPause,
  onStop,
}: TimerBarProps) {
  const t = useTranslations("practice");

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = total > 0 ? (remaining / total) * 100 : 0;

  const getColor = () => {
    if (progress > 50) return "bg-green-500";
    if (progress > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTextColor = () => {
    if (progress > 50) return "text-green-600 dark:text-green-400";
    if (progress > 20) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className={`text-2xl font-mono font-bold tabular-nums ${getTextColor()}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPause}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={isPaused ? t("resumeTimer") : t("pauseTimer")}
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onStop}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            title={t("stopTimer")}
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} rounded-full transition-all duration-1000 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
