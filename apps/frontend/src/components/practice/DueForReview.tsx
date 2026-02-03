"use client";

import { useEffect, useState } from "react";
import { practiceApi } from "@/lib/api";
import { useTranslations } from "next-intl";
import { Clock, ChevronRight, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLoginDialog } from "@/contexts/login-dialog-context";

interface DueQuestion {
  id: string;
  title: string;
  content: string;
  answer?: string;
  topicId: string;
  level: string;
  status: string;
  topic?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  nextReviewAt: string | null;
  dueStatus: {
    isDue: boolean;
    text: string;
    daysUntil?: number;
  };
}

export function DueForReview() {
  const t = useTranslations("practice");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { openDialog } = useLoginDialog();
  const [questions, setQuestions] = useState<DueQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Only load questions if user is authenticated
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadDueQuestions = async () => {
      try {
        const data = await practiceApi.getQuestionsDueForReview(10);
        setQuestions(data);
      } catch (error) {
        console.error("Failed to load due questions", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDueQuestions();
  }, [user]);

  // Show loading state while checking auth
  if (authLoading || isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {t("dueForReview")}
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("dueForReview")}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <button
              onClick={openDialog}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              {tAuth("login")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {t("dueForReview")}
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  const dueCount = questions.filter(q => q.dueStatus.isDue).length;
  const totalCount = questions.length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          {t("dueForReview")}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            dueCount > 0
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {dueCount} {t("due")}
          </span>
          <ChevronRight
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {questions.map((question) => (
            <button
              key={question.id}
              onClick={() => router.push(`/practice?question=${question.id}`)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {question.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {question.topic && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: question.topic.color + '20',
                          color: question.topic.color,
                        }}
                      >
                        {question.topic.name}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      question.level === 'senior'
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : question.level === 'middle'
                        ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {question.level}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-xs font-medium ${
                      question.dueStatus.isDue
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {question.dueStatus.text}
                  </span>
                </div>
              </div>
            </button>
          ))}

          {totalCount > questions.length && (
            <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2">
              {t("viewAll")} ({totalCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
