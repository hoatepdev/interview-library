"use client";

import { useEffect, useState } from "react";
import { practiceApi } from "@/lib/api";
import { useTranslations } from "next-intl";
import { Clock, ChevronRight, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLoginDialog } from "@/contexts/login-dialog-context";
import { DueQuestion } from "@/types";

export function DueForReview() {
  const t = useTranslations("practice");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
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
              onClick={() => openDialog()}
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
    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
           <div className="p-2 bg-orange-500/10 rounded-lg">
             <Clock className="w-5 h-5 text-orange-500" />
           </div>
           <div>
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {t("dueForReview")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {dueCount} {t("due")}{tCommon("bulletSeparator")}{totalCount} {tCommon("total")}
              </p>
           </div>
        </div>
        
        <ChevronRight
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="bg-slate-50/50 dark:bg-black/20 border-t border-slate-200/60 dark:border-white/5">
          {questions.map((question) => (
            <button
              key={question.id}
              onClick={() => router.push(`/practice?question=${question.id}`)}
              className="w-full text-left p-4 border-b border-slate-200/50 dark:border-white/5 last:border-0 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors">
                    {question.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {question.topic && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                        style={{
                          backgroundColor: question.topic.color ? `${question.topic.color}10` : 'rgba(148, 163, 184, 0.1)',
                          borderColor: question.topic.color ? `${question.topic.color}20` : 'rgba(148, 163, 184, 0.2)',
                          color: question.topic.color || '#94a3b8',
                        }}
                      >
                        {question.topic.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      question.dueStatus.isDue
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {question.dueStatus.text}
                  </span>
                </div>
              </div>
            </button>
          ))}

          {totalCount > questions.length && (
            <button className="w-full p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-500/5">
              {t("viewAll")} ({totalCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
