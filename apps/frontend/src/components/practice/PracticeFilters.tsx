"use client";

import { Filter, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Topic } from "@/types";
import { QuestionLevel } from "@/types";

interface PracticeFiltersProps {
  topics: Topic[];
  selectedTopicId: string;
  selectedLevel: string;
  onTopicChange: (topicId: string) => void;
  onLevelChange: (level: string) => void;
  onClear: () => void;
}

export function PracticeFilters({
  topics,
  selectedTopicId,
  selectedLevel,
  onTopicChange,
  onLevelChange,
  onClear,
}: PracticeFiltersProps) {
  const t = useTranslations("practice");
  const tQuestions = useTranslations("questions");

  const hasFilters = selectedTopicId !== "" || selectedLevel !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
        <Filter className="w-3.5 h-3.5" />
      </div>

      <select
        value={selectedTopicId}
        onChange={(e) => onTopicChange(e.target.value)}
        className="text-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
      >
        <option value="">{t("filterByTopic")}</option>
        {topics.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.name}
          </option>
        ))}
      </select>

      <select
        value={selectedLevel}
        onChange={(e) => onLevelChange(e.target.value)}
        className="text-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
      >
        <option value="">{t("filterByLevel")}</option>
        {Object.values(QuestionLevel).map((level) => (
          <option key={level} value={level}>
            {tQuestions(`levels.${level}`)}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <X className="w-3 h-3" />
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
