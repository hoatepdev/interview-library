"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { practiceApi } from "@/lib/api";
import { Link } from "@/i18n/routing";
import type { PracticeLogEntry } from "@/types";

const ratingColors: Record<string, string> = {
  poor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  fair: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  good: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  great: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function RecentHistoryTable() {
  const t = useTranslations("analytics");
  const tPractice = useTranslations("practice");
  const [entries, setEntries] = useState<PracticeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await practiceApi.getHistory({ limit: 10 });
        setEntries(result.data);
      } catch (error) {
        console.error("Failed to load recent history", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 py-2">
            <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-14 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
        {t("noDataYet")}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {entry.questionTitle}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {entry.topicName && <span>{entry.topicName}</span>}
                <span>{new Date(entry.practicedAt).toLocaleDateString()}</span>
                {entry.timeSpentSeconds != null && (
                  <span>{entry.timeSpentSeconds}s</span>
                )}
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${ratingColors[entry.rating] || ""}`}
            >
              {tPractice(`ratings.${entry.rating}`)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/5">
        <Link
          href="/practice/history"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {t("viewFullHistory")} →
        </Link>
      </div>
    </div>
  );
}
