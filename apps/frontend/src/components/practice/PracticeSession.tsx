"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Question } from "@/types";
import { practiceApi } from "@/lib/api";
import { SelfRating } from "@/types";
import { QuestionCard } from "./QuestionCard";
import { AnswerReveal } from "./AnswerReveal";
import { SelfRatingComponent } from "./SelfRating";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Sparkles, Shuffle } from "lucide-react";
import { useTranslations } from "next-intl";

type PracticeMode = "smart" | "random";

interface ExtendedQuestion extends Question {
  isPrioritized?: boolean;
}

export function PracticeSession() {
  const t = useTranslations("practice");
  const [question, setQuestion] = useState<ExtendedQuestion | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId] = useState(() => Date.now()); // Track session start time

  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now(),
  );
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("smart");
  const [dueCount, setDueCount] = useState<number>(0);
  const { requireAuth } = useRequireAuth();

  // Load due questions count
  useEffect(() => {
    const loadDueCount = async () => {
      try {
        const res = await practiceApi.getDueQuestionsCount();
        setDueCount(res.count);
      } catch (error) {
        console.error("Failed to load due count", error);
      }
    };
    loadDueCount();
  }, []);

  const loadQuestion = useCallback(
    async (excludeQuestionId?: string) => {
      setIsLoading(true);
      setIsRevealed(false);
      setQuestionStartTime(Date.now());
      try {
        // Use smart practice for authenticated users, random for guests
        const q =
          practiceMode === "smart"
            ? await practiceApi.getNextQuestion({ excludeQuestionId })
            : await practiceApi.getRandomQuestion({ excludeQuestionId });
        setQuestion(q);
      } catch (error) {
        console.error("Failed to load question", error);
      } finally {
        setIsLoading(false);
      }
    },
    [practiceMode],
  );

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleRate = async (rating: SelfRating) => {
    if (!question) return;

    const timeSpentSeconds = Math.round(
      (Date.now() - questionStartTime) / 1000,
    );

    requireAuth(async () => {
      try {
        await practiceApi.logPractice({
          questionId: question.id,
          selfRating: rating,
          timeSpentSeconds,
        });

        // Refresh due count after logging
        try {
          const res = await practiceApi.getDueQuestionsCount();
          setDueCount(res.count);
        } catch {
          // Ignore error
        }
      } catch (error) {
        console.error("Failed to log practice", error);
      }

      // Load next question, excluding current one
      await loadQuestion(question.id);
    });
  };

  const handleModeChange = (mode: PracticeMode) => {
    setPracticeMode(mode);
    // Reload question with new mode
    loadQuestion(question?.id);
  };

  const handleReveal = () => {
    requireAuth(() => {
      setIsRevealed(true);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center p-12 text-gray-900 dark:text-white">
        {t("failedToLoadQuestion")}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Practice Mode Selector */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full sm:w-auto">
          <button
            onClick={() => handleModeChange("smart")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              practiceMode === "smart"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("modeSmartLabel")}</span>
            {dueCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                  practiceMode === "smart"
                    ? "bg-blue-600 text-white"
                    : "bg-orange-500 text-white"
                }`}
              >
                {dueCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleModeChange("random")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              practiceMode === "random"
                ? "bg-slate-700 dark:bg-slate-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>{t("modeRandomLabel")}</span>
          </button>
        </div>

        {/* Priority indicator */}
        {question.isPrioritized && practiceMode === "smart" && (
          <div className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("dueForReviewBadge")}</span>
          </div>
        )}
      </div>

      <QuestionCard question={question} />

      <div className="mt-8">
        {!isRevealed ? (
          <AnswerReveal
            answer={question.answer}
            isRevealed={isRevealed}
            onReveal={handleReveal}
          />
        ) : (
          <div className="space-y-8 fade-in">
            <AnswerReveal
              answer={question.answer}
              isRevealed={isRevealed}
              onReveal={handleReveal}
            />
            <SelfRatingComponent onRate={handleRate} />
          </div>
        )}
      </div>
    </div>
  );
}
