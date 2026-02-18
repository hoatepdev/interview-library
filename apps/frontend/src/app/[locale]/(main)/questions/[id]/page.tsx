"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { questionsApi, getTopics, Question, Topic } from "@/lib/api";
import { QuestionLevel } from "@/types";

import {
  Pencil,
  Trash2,
  Star,
  ArrowLeft,
  Clock,
  Calendar,
  BookOpen,
  Tag,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  RichTextEditor,
  RichTextPreview,
} from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function QuestionDetailContent() {
  const t = useTranslations("questions");
  const tForm = useTranslations("form");
  const tCommon = useTranslations("common");
  const tNotif = useTranslations("notifications");
  const params = useParams();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();

  const questionId = params.id as string;
  const [question, setQuestion] = useState<Question | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    answer: "",
    topicId: "",
    level: "junior" as QuestionLevel,
  });

  const fetchQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await questionsApi.getById(questionId);
      setQuestion(data);
      // Initialize edit form with current data
      setEditForm({
        title: data.title,
        content: data.content,
        answer: data.answer || "",
        topicId: data.topicId,
        level: data.level,
      });
    } catch (error) {
      console.error("Failed to fetch question", error);
      toast.error(tNotif("error"));
    } finally {
      setIsLoading(false);
    }
  }, [questionId, tNotif]);

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
    getTopics().then(setTopics);
  }, [questionId, fetchQuestion]);

  const handleToggleFavorite = () => {
    requireAuth(async () => {
      if (!question) return;
      try {
        await questionsApi.toggleFavorite(question.id);
        await fetchQuestion();
        toast.success(tNotif("questionUpdated"));
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        toast.error(tNotif("error"));
      }
    });
  };

  const handleDelete = async () => {
    if (!question) return;
    try {
      await questionsApi.delete(question.id);
      toast.success(tNotif("questionDeleted"));
      router.push("/questions");
    } catch (error) {
      console.error("Failed to delete question:", error);
      toast.error(tNotif("error"));
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleEditClick = () => {
    requireAuth(() => {
      setIsEditMode(true);
    });
  };

  const handleCancelEdit = () => {
    // Reset form to original data
    if (question) {
      setEditForm({
        title: question.title,
        content: question.content,
        answer: question.answer || "",
        topicId: question.topicId,
        level: question.level,
      });
    }
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!question) return;

    setIsSaving(true);
    try {
      await questionsApi.update(question.id, {
        title: editForm.title,
        content: editForm.content,
        answer: editForm.answer || undefined,
        topicId: editForm.topicId,
        level: editForm.level,
      });

      await fetchQuestion();
      setIsEditMode(false);
      toast.success(tNotif("questionUpdated"));
    } catch (error) {
      console.error("Failed to update question:", error);
      toast.error(tNotif("error"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-none p-6 h-32 animate-pulse border border-gray-100 dark:border-gray-700"
          />
        ))}
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-white/5">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {tCommon("notFound")}
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          {t("questionNotFound")}
        </p>
      </div>
    );
  }

  if (isEditMode) {
    // EDIT MODE
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancelEdit}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex-1">
            {t("editQuestion")}
          </h1>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? tForm("saving") : tForm("save")}
          </Button>
        </div>

        {/* Edit Form */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">{tForm("title")}</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder={tForm("enterTitle")}
                disabled={isSaving}
              />
            </div>

            {/* Topic and Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-topic">{tForm("topic")}</Label>
                <Select
                  value={editForm.topicId}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, topicId: value })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id="edit-topic">
                    <SelectValue placeholder={tForm("selectTopic")} />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-level">{tForm("level")}</Label>
                <Select
                  value={editForm.level}
                  onValueChange={(value: string) =>
                    setEditForm({ ...editForm, level: value as QuestionLevel })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id="edit-level">
                    <SelectValue placeholder={tForm("selectLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">{t("levels.junior")}</SelectItem>
                    <SelectItem value="middle">{t("levels.middle")}</SelectItem>
                    <SelectItem value="senior">{t("levels.senior")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content with Rich Text Editor */}
            <div className="space-y-2">
              <Label>{tForm("questionContent")}</Label>
              <RichTextEditor
                value={editForm.content}
                onChange={(value) =>
                  setEditForm({ ...editForm, content: value })
                }
                placeholder={tForm("enterContent")}
                disabled={isSaving}
                minHeight={300}
              />
            </div>

            {/* Answer with Rich Text Editor */}
            <div className="space-y-2">
              <Label>{tForm("answerOptional")}</Label>
              <RichTextEditor
                value={editForm.answer}
                onChange={(value) =>
                  setEditForm({ ...editForm, answer: value })
                }
                placeholder={tForm("enterAnswer")}
                disabled={isSaving}
                minHeight={200}
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t("preview")}
          </h2>

          {/* Content Preview */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
              {tForm("questionContent")}
            </h3>
            <RichTextPreview
              content={editForm.content}
              className="prose prose-slate dark:prose-invert max-w-none"
            />
          </div>

          {/* Answer Preview */}
          {editForm.answer && (
            <div className="bg-blue-500/5 dark:bg-blue-500/10 backdrop-blur-xl p-8 rounded-2xl border border-blue-500/20 dark:border-blue-400/10 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                {tForm("answer")}
              </h3>
              <RichTextPreview
                content={editForm.answer}
                className="prose prose-slate dark:prose-invert max-w-none"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW MODE
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/questions")}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex-1">
          {t("questionDetails")}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
              question.isFavorite
                ? "text-yellow-500 bg-yellow-500/10"
                : "text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10"
            }`}
            title={question.isFavorite ? t("removeFavorite") : t("addFavorite")}
          >
            <Star
              className={`w-5 h-5 ${question.isFavorite ? "fill-current" : ""}`}
            />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditClick}
            className="rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            title={t("edit")}
          >
            <Pencil className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => requireAuth(() => setShowDeleteModal(true))}
            className="rounded-full text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            title={t("delete")}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Card */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {question.topic && (
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border"
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
                  <Tag className="w-3 h-3 mr-1" />
                  {question.topic.name}
                </span>
              )}
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  question.level === "senior"
                    ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                    : question.level === "middle"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {question.level}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  question.status === "new"
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    : question.status === "learning"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                      : "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                }`}
              >
                {question.status}
              </span>
              {/* Due Status Badge */}
              {question.dueStatus && (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
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

            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {question.title}
            </h2>

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <RichTextPreview
                content={question.content}
                className="text-slate-700 dark:text-slate-300 leading-relaxed"
              />
            </div>
          </div>

          {/* Answer Card */}
          {question.answer && (
            <div className="bg-blue-500/5 dark:bg-blue-500/10 backdrop-blur-xl p-8 rounded-2xl border border-blue-500/20 dark:border-blue-400/10 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                {t("answer")}
              </h3>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <RichTextPreview
                  content={question.answer}
                  className="text-slate-700 dark:text-slate-300 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Info */}
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
              {t("information")}
            </h3>

            <div className="space-y-4">
              {/* Practice Count */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("practiceCount")}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {question.practiceCount}x
                  </p>
                </div>
              </div>

              {/* Last Practiced */}
              {question.lastPracticedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">
                      {t("lastPracticed")}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(question.lastPracticedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("createdAt")}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {new Date(question.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
              {t("actions")}
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/practice")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {t("startPractice")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title={t("deleteQuestion")}
        description={t("deleteQuestionConfirm")}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}

export default function QuestionDetailPage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense
      fallback={<div className="container mx-auto">{tCommon("loading")}</div>}
    >
      <QuestionDetailContent />
    </Suspense>
  );
}
