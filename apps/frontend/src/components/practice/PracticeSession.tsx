"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Question } from "@/types";
import { practiceApi } from "@/lib/api";
import { SelfRating } from "@/types";
import { QuestionCard } from "./QuestionCard";
import { AnswerReveal } from "./AnswerReveal";
import { SelfRatingComponent } from "./SelfRating";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function PracticeSession() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId] = useState(() => Date.now()); // Track session start time
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const { requireAuth } = useRequireAuth();

  const loadQuestion = useCallback(async (excludeQuestionId?: string) => {
    setIsLoading(true);
    setIsRevealed(false);
    setQuestionStartTime(Date.now());
    try {
      const q = await practiceApi.getRandomQuestion({ excludeQuestionId });
      setQuestion(q);
    } catch (error) {
      console.error("Failed to load question", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleRate = (rating: SelfRating) => {
    if (!question) return;

    const timeSpentSeconds = Math.round((Date.now() - questionStartTime) / 1000);

    requireAuth(async () => {
      try {
        await practiceApi.logPractice({
          questionId: question.id,
          selfRating: rating,
          timeSpentSeconds,
        });
      } catch (error) {
        console.error("Failed to log practice", error);
      }

      // Load next question, excluding current one
      await loadQuestion(question.id);
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
    return <div className="text-center p-12 text-gray-900 dark:text-white">Failed to load question.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <QuestionCard question={question} />

      <div className="mt-8">
        {!isRevealed ? (
          <AnswerReveal
            answer={question.answer}
            isRevealed={isRevealed}
            onReveal={() => setIsRevealed(true)}
          />
        ) : (
          <div className="space-y-8 fade-in">
             <AnswerReveal
              answer={question.answer}
              isRevealed={isRevealed}
              onReveal={() => setIsRevealed(true)}
            />
            <SelfRatingComponent onRate={handleRate} />
          </div>
        )}
      </div>
    </div>
  );
}
