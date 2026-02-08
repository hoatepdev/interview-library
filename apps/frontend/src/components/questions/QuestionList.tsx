import { Question } from "@/types";
import { Pencil, Trash2, Star, LayoutGrid, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface QuestionListProps {
  questions: Question[];
  onEdit?: (question: Question) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function QuestionList({
  questions,
  onEdit,
  onDelete,
  onToggleFavorite,
}: QuestionListProps) {
  const t = useTranslations("questions");
  const tCommon = useTranslations("common");
  const { requireAuth } = useRequireAuth();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-white/5">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
          <LayoutGrid className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {tCommon("noData")}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          {t("searchPlaceholder")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {questions.map((question) => (
          <div
            key={question.id}
            className="group relative flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-400/30 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1"
          >
            {/* Header & Badges */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-wrap gap-2">
                {question.topic && (
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    style={{
                      backgroundColor: question.topic.color
                        ? `${question.topic.color}10`
                        : "rgba(148, 163, 184, 0.1)",
                      borderColor: question.topic.color
                        ? `${question.topic.color}30`
                        : "rgba(148, 163, 184, 0.2)",
                      color: question.topic.color || "#94a3b8",
                    }}
                  >
                    {question.topic.name}
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    question.level === "senior"
                      ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                      : question.level === "middle"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {question.level}
                </span>
                {/* Due Status Badge */}
                {question.dueStatus && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      question.dueStatus.isDue
                        ? "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                    title={question.dueStatus.text}
                  >
                    <Clock className="w-3 h-3" />
                    {question.dueStatus.isDue
                      ? "Due"
                      : question.dueStatus.daysUntil === 1
                        ? "Tomorrow"
                        : `${question.dueStatus.daysUntil}d`}
                  </span>
                )}
              </div>

              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    requireAuth(() => onToggleFavorite(question.id));
                  }}
                  className={`p-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    question.isFavorite
                      ? "text-yellow-500 bg-yellow-500/10"
                      : "text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${question.isFavorite ? "fill-current" : ""}`}
                  />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {question.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {question.content}
              </p>
            </div>

            {/* Footer & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 mt-auto">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                    question.status === "new"
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      : question.status === "learning"
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                  }`}
                >
                  {question.status}
                </span>
                {question.practiceCount > 0 && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {question.practiceCount}x
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 transform translate-x-2 sm:translate-x-4 sm:group-hover:translate-x-0">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(question);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      requireAuth(() => {
                        setDeletingId(question.id);
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t("deleteQuestion")}
        description={t("deleteQuestionConfirm")}
        onConfirm={() => {
          if (deletingId && onDelete) {
            onDelete(deletingId);
            setDeletingId(null);
          }
        }}
        variant="destructive"
      />
    </>
  );
}
