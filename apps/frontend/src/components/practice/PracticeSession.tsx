"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Question, Topic, SelfRating } from "@/types";
import { practiceApi, topicsApi } from "@/lib/api";
import { QuestionCard } from "./QuestionCard";
import { AnswerReveal } from "./AnswerReveal";
import { SelfRatingComponent } from "./SelfRating";
import { PracticeFilters } from "./PracticeFilters";
import { PracticeNotes } from "./PracticeNotes";
import { TimerSetup } from "./TimerSetup";
import { TimerBar } from "./TimerBar";
import { SessionSummary, type SessionResult } from "./SessionSummary";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Sparkles, Shuffle, Timer } from "lucide-react";
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

  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now(),
  );
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("smart");
  const [dueCount, setDueCount] = useState<number>(0);
  const { requireAuth } = useRequireAuth();

  // Filters state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  // Notes state
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0); // total seconds
  const [timerRemaining, setTimerRemaining] = useState(0); // remaining seconds
  const [timerPaused, setTimerPaused] = useState(false);
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load topics for filters
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const data = await topicsApi.getAll();
        setTopics(data);
      } catch (error) {
        console.error("Failed to load topics", error);
      }
    };
    loadTopics();
  }, []);

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

  // Timer countdown
  useEffect(() => {
    if (timerActive && !timerPaused && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            setShowSummary(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timerPaused, timerRemaining]);

  const loadQuestion = useCallback(
    async (excludeQuestionId?: string) => {
      setIsLoading(true);
      setIsRevealed(false);
      setQuestionStartTime(Date.now());
      setNotes("");
      setShowNotes(false);
      try {
        const params: Record<string, string | undefined> = {
          excludeQuestionId,
        };
        if (selectedTopicId) params.topicId = selectedTopicId;
        if (selectedLevel) params.level = selectedLevel;

        const q =
          practiceMode === "smart"
            ? await practiceApi.getNextQuestion(params)
            : await practiceApi.getRandomQuestion(params);
        setQuestion(q);
      } catch (error) {
        console.error("Failed to load question", error);
        setQuestion(null);
      } finally {
        setIsLoading(false);
      }
    },
    [practiceMode, selectedTopicId, selectedLevel],
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
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        });

        // Track session results for timed mode
        if (timerActive) {
          setSessionResults((prev) => [
            ...prev,
            {
              questionId: question.id,
              questionTitle: question.title,
              rating,
              timeSpentSeconds,
            },
          ]);
        }

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
  };

  const handleReveal = () => {
    requireAuth(() => {
      setIsRevealed(true);
    });
  };

  const handleFilterChange = (topicId: string, level: string) => {
    setSelectedTopicId(topicId);
    setSelectedLevel(level);
  };

  const handleClearFilters = () => {
    setSelectedTopicId("");
    setSelectedLevel("");
  };

  const handleStartTimer = (durationMinutes: number) => {
    const totalSeconds = durationMinutes * 60;
    setTimerDuration(totalSeconds);
    setTimerRemaining(totalSeconds);
    setTimerActive(true);
    setTimerPaused(false);
    setSessionResults([]);
    setShowTimerSetup(false);
    setShowSummary(false);
  };

  const handlePauseTimer = () => {
    setTimerPaused((prev) => !prev);
  };

  const handleStopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    setShowSummary(true);
  };

  const handleNewSession = () => {
    setShowSummary(false);
    setSessionResults([]);
    setShowTimerSetup(true);
  };

  const handleExitSession = () => {
    setShowSummary(false);
    setSessionResults([]);
    setTimerActive(false);
    setShowTimerSetup(false);
    setTimerDuration(0);
    setTimerRemaining(0);
  };

  // Show session summary
  if (showSummary) {
    return (
      <SessionSummary
        results={sessionResults}
        duration={timerDuration}
        onNewSession={handleNewSession}
        onExit={handleExitSession}
      />
    );
  }

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
      {/* Timer Bar (when active) */}
      {timerActive && (
        <div className="mb-4">
          <TimerBar
            remaining={timerRemaining}
            total={timerDuration}
            isPaused={timerPaused}
            onPause={handlePauseTimer}
            onStop={handleStopTimer}
          />
        </div>
      )}

      {/* Practice Mode Selector + Timer Toggle */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

        <div className="flex items-center gap-2">
          {/* Priority indicator */}
          {question.isPrioritized && practiceMode === "smart" && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("dueForReviewBadge")}</span>
            </div>
          )}

          {/* Timer toggle */}
          {!timerActive && (
            <button
              onClick={() => setShowTimerSetup((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                showTimerSetup
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{t("timedMode")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Timer Setup */}
      {showTimerSetup && !timerActive && (
        <div className="mb-4">
          <TimerSetup onStart={handleStartTimer} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4">
        <PracticeFilters
          topics={topics}
          selectedTopicId={selectedTopicId}
          selectedLevel={selectedLevel}
          onTopicChange={(id) => handleFilterChange(id, selectedLevel)}
          onLevelChange={(level) => handleFilterChange(selectedTopicId, level)}
          onClear={handleClearFilters}
        />
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
          <div className="space-y-6 fade-in">
            <AnswerReveal
              answer={question.answer}
              isRevealed={isRevealed}
              onReveal={handleReveal}
            />

            {/* Notes */}
            <PracticeNotes
              notes={notes}
              onNotesChange={setNotes}
              isExpanded={showNotes}
              onToggle={() => setShowNotes((prev) => !prev)}
            />

            <SelfRatingComponent onRate={handleRate} />
          </div>
        )}
      </div>
    </div>
  );
}
