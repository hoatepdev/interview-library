"use client";

import { useTranslations } from "next-intl";

interface DateRangePickerProps {
  value: number;
  onChange: (days: number) => void;
}

const PRESETS = [7, 14, 30, 90] as const;

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const t = useTranslations("analytics");

  const labels: Record<number, string> = {
    7: t("last7Days"),
    14: t("last14Days"),
    30: t("last30Days"),
    90: t("last90Days"),
  };

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      {PRESETS.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === d
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          {labels[d]}
        </button>
      ))}
    </div>
  );
}
