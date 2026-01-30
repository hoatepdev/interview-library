import { Question } from "@/types";
import { Badge, Pencil, Trash2, Star } from "lucide-react";

interface QuestionListProps {
  questions: Question[];
  onEdit?: (question: Question) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function QuestionList({ questions, onEdit, onDelete, onToggleFavorite }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none">
        <p className="text-gray-500 dark:text-gray-400">No questions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <div
          key={question.id}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-shadow group"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                  {question.topicId}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                    question.level === "senior"
                      ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                      : question.level === "middle"
                      ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  }`}
                >
                  {question.level}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                    question.status === "new"
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      : question.status === "learning"
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  }`}
                >
                  {question.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {question.title}
              </h3>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(question.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    question.isFavorite
                      ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      : "text-gray-400 dark:text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  }`}
                  title={question.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={`w-4 h-4 ${question.isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(question)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Edit question"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${question.title}"?`)) {
                      onDelete(question.id);
                    }
                  }}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">{question.content}</p>
        </div>
      ))}
    </div>
  );
}
