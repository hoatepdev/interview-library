"use client";

import { Timer } from "lucide-react";
import { useTranslations } from "next-intl";

interface TimerSetupProps {
  onStart: (durationMinutes: number) => void;
}

const DURATIONS = [5, 10, 15, 30] as const;

export function TimerSetup({ onStart }: TimerSetupProps) {
  const t = useTranslations("practice");

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("timerSetup")}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => onStart(d)}
            className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-blue-500 hover:text-white text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
          >
            {t(`timerDurations.${d}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
