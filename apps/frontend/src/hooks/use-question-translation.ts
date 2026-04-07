"use client";

import { useState, useCallback } from "react";
import { translationsApi, type QuestionTranslation } from "@/lib/api";
import type { Question } from "@/types";

type TranslationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; translation: QuestionTranslation }
  | { status: "error"; error: string };

/**
 * Manages Vietnamese translation for a question.
 *
 * - First tries to load an existing translation from the DB.
 * - If none exists, calls the AI translate endpoint and saves the result.
 * - Returns the translated fields (or original as fallback).
 */
export function useQuestionTranslation(question: Question | null) {
  const [state, setState] = useState<TranslationState>({ status: "idle" });
  const [isVietnamese, setIsVietnamese] = useState(false);

  const loadTranslation = useCallback(async () => {
    if (!question) return;

    setState({ status: "loading" });
    try {
      // Try existing DB translation first
      const existing = await translationsApi.getQuestionTranslation(
        question.id,
        "vi",
      );
      setState({ status: "loaded", translation: existing });
      setIsVietnamese(true);
      return;
    } catch {
      // 404 — no translation yet, fall through to AI
    }

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: question.title,
          content: question.content,
          answer: question.answer ?? undefined,
          targetLocale: "vi",
        }),
      });

      if (!res.ok) throw new Error("AI translation failed");

      const translated: { title: string; content: string; answer?: string } =
        await res.json();

      // Save to DB so future loads are instant
      let saved: QuestionTranslation;
      try {
        saved = await translationsApi.createQuestionTranslation({
          questionId: question.id,
          locale: "vi",
          title: translated.title,
          content: translated.content,
          answer: translated.answer,
        });
      } catch {
        // Conflict (race condition) — load what's already there
        saved = await translationsApi.getQuestionTranslation(question.id, "vi");
      }

      setState({ status: "loaded", translation: saved });
      setIsVietnamese(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Translation failed";
      setState({ status: "error", error: message });
    }
  }, [question]);

  const showOriginal = useCallback(() => {
    setState({ status: "idle" });
    setIsVietnamese(false);
  }, []);

  const displayTitle =
    isVietnamese && state.status === "loaded"
      ? state.translation.title
      : question?.title ?? "";

  const displayContent =
    isVietnamese && state.status === "loaded"
      ? state.translation.content
      : question?.content ?? "";

  const displayAnswer =
    isVietnamese && state.status === "loaded"
      ? (state.translation.answer ?? question?.answer)
      : question?.answer;

  return {
    isVietnamese,
    isLoading: state.status === "loading",
    error: state.status === "error" ? state.error : null,
    displayTitle,
    displayContent,
    displayAnswer,
    loadTranslation,
    showOriginal,
  };
}
