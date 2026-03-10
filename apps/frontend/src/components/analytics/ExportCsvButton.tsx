"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AnalyticsResponse } from "@/types";

interface ExportCsvButtonProps {
  analytics: AnalyticsResponse | null;
}

export function ExportCsvButton({ analytics }: ExportCsvButtonProps) {
  const t = useTranslations("analytics");

  const handleExport = () => {
    if (!analytics) return;

    const rows: string[] = [];

    // Daily activity section
    rows.push("--- Daily Activity ---");
    rows.push("Date,Sessions,Time (min)");
    for (const day of analytics.dailyActivity) {
      rows.push(`${day.date},${day.sessions},${day.timeSpentMinutes}`);
    }

    rows.push("");

    // Rating trend section
    rows.push("--- Rating Trend ---");
    rows.push("Date,Poor,Fair,Good,Great");
    for (const day of analytics.ratingTrend) {
      rows.push(`${day.date},${day.poor},${day.fair},${day.good},${day.great}`);
    }

    rows.push("");

    // Topic mastery section
    if (analytics.topicMastery.length > 0) {
      rows.push("--- Topic Mastery ---");
      rows.push("Topic,New,Learning,Mastered,Total");
      for (const topic of analytics.topicMastery) {
        rows.push(
          `"${topic.topicName}",${topic.new},${topic.learning},${topic.mastered},${topic.total}`,
        );
      }
    }

    rows.push("");
    rows.push("--- Streak ---");
    rows.push(`Current,${analytics.streak.current}`);
    rows.push(`Longest,${analytics.streak.longest}`);

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `practice-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!analytics}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download className="w-3.5 h-3.5" />
      {t("exportCsv")}
    </button>
  );
}
