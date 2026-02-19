"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { practiceApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DueQuestion } from "@/types";

export function NotificationBell() {
  const t = useTranslations("practice");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const router = useRouter();
  const [dueCount, setDueCount] = useState(0);
  const [dueQuestions, setDueQuestions] = useState<DueQuestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setDueCount(0);
      return;
    }

    const loadDueCount = async () => {
      try {
        const res = await practiceApi.getDueQuestionsCount();
        setDueCount(res.count);
      } catch (error) {
        console.error("Failed to load due count", error);
      }
    };

    loadDueCount();

    // Refresh every 5 minutes
    const interval = setInterval(loadDueCount, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const loadDueQuestions = async () => {
    if (!user) return;

    try {
      const data = await practiceApi.getQuestionsDueForReview(5);
      setDueQuestions(data.filter(q => q.dueStatus.isDue));
    } catch (error) {
      console.error("Failed to load due questions", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadDueQuestions();
    }
  };

  const handleQuestionClick = (questionId: string) => {
    setIsOpen(false);
    router.push(`/practice?question=${questionId}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push("/practice");
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
          {dueCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              {dueCount > 9 ? "9+" : dueCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {t("notifications")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {dueCount > 0
              ? `${dueCount} ${t("questionsDueForReview")}`
              : t("noNotifications")}
          </p>
        </div>

        {dueQuestions.length > 0 ? (
          <>
            <div className="max-h-80 overflow-y-auto">
              {dueQuestions.map((question) => (
                <DropdownMenuItem
                  key={question.id}
                  onClick={() => handleQuestionClick(question.id)}
                  className="cursor-pointer px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-slate-50 dark:focus:bg-slate-800"
                >
                  <div className="flex flex-col gap-1 w-full">
                    <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                      {question.title}
                    </p>
                    <div className="flex items-center gap-2">
                      {question.topic && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: question.topic.color ? `${question.topic.color}15` : 'rgba(148, 163, 184, 0.1)',
                            color: question.topic.color || '#94a3b8',
                          }}
                        >
                          {question.topic.name}
                        </span>
                      )}
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        {question.dueStatus.text}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            {dueCount > 5 && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleViewAll}
                  className="w-full px-4 py-2 text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t("viewAllDue")} ({dueCount})
                </button>
              </div>
            )}
          </>
        ) : dueCount === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("allCaughtUp")}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
