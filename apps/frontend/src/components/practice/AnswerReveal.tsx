"use client";

import { Eye, EyeOff } from "lucide-react";
import { RichTextPreview } from "@/components/ui/rich-text-editor";
import { useTranslations } from "next-intl";

interface AnswerRevealProps {
  answer?: string;
  onReveal: () => void;
  isRevealed: boolean;
}

export function AnswerReveal({ answer, onReveal, isRevealed }: AnswerRevealProps) {
  const t = useTranslations("practice");

  if (!isRevealed) {
    return (
      <button
        onClick={onReveal}
        className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
      >
        <Eye className="w-5 h-5" />
        <span>{t("showAnswerButton")}</span>
      </button>
    );
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 mt-6 anime-fade-in">
      <div className="flex items-center space-x-2 text-green-700 dark:text-green-400 font-medium mb-3">
        <EyeOff className="w-5 h-5" />
        <span>{t("answerRevealedLabel")}</span>
      </div>
      <div className="prose max-w-none text-gray-800 dark:text-gray-200">
        {answer ? (
          <RichTextPreview content={answer} />
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">{t("noAnswerProvided")}</p>
        )}
      </div>
    </div>
  );
}
