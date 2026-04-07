import { Question } from "@/types";
import { useTranslations } from "next-intl";

interface QuestionCardProps {
  question: Question;
  displayTitle?: string;
  displayContent?: string;
}

export function QuestionCard({ question, displayTitle, displayContent }: QuestionCardProps) {
  const t = useTranslations("questions");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-none border border-gray-100 dark:border-gray-700 p-6 sm:p-8 mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wide">
          {question.level}
        </span>
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          {question.topic?.name || t("uncategorized")}
          {question.isFavorite && (
            <span className="ml-2 text-yellow-500">⭐</span>
          )}
        </span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {displayTitle ?? question.title}
      </h2>
      <div className="prose max-w-none text-gray-600 dark:text-gray-300">
        <p>{displayContent ?? question.content}</p>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {!!question.difficultyScore && (
          <span>
            {t("difficultyLabel")} {question.difficultyScore}
          </span>
        )}
      </div>
    </div>
  );
}
