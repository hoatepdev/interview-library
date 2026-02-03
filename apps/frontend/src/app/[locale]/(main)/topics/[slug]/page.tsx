"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { topicsApi, questionsApi, Topic, Question } from "@/lib/api";
import { QuestionList } from "@/components/questions/QuestionList";
import { QuestionForm } from "@/components/questions/QuestionForm";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function TopicDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations("questions");
  const tNotif = useTranslations("notifications");
  const tTopics = useTranslations("topics");
  const { requireAuth } = useRequireAuth();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const fetchTopic = async () => {
    try {
      const data = await topicsApi.getBySlug(slug);
      setTopic(data);
    } catch (error) {
      console.error("Failed to fetch topic:", error);
      toast.error(tNotif("error"));
    }
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await questionsApi.getByTopicSlug(slug);
      setQuestions(data);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toast.error(tNotif("error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchTopic();
      fetchQuestions();
    }
  }, [slug]);

  const handleCreateQuestion = async (data: any) => {
    setIsSubmitting(true);
    try {
      await questionsApi.create({
        ...data,
        topicId: topic?.id || "",
      });

      setIsDialogOpen(false);
      await fetchQuestions();
      toast.success(tNotif("questionCreated"));
    } catch (error) {
      console.error("Failed to create question:", error);
      toast.error(tNotif("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = async (data: any) => {
    if (!editingQuestion) return;

    setIsSubmitting(true);
    try {
      await questionsApi.update(editingQuestion.id, data);

      setIsDialogOpen(false);
      setEditingQuestion(null);
      await fetchQuestions();
      toast.success(tNotif("questionUpdated"));
    } catch (error) {
      console.error("Failed to update question:", error);
      toast.error(tNotif("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await questionsApi.delete(id);
      await fetchQuestions();
      toast.success(tNotif("questionDeleted"));
    } catch (error) {
      console.error("Failed to delete question:", error);
      toast.error(tNotif("error"));
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await questionsApi.toggleFavorite(id);
      await fetchQuestions();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  // Auth wrappers for protected actions
  const handleCreateQuestionClick = () => {
    requireAuth(() => {
      setEditingQuestion(null);
      setIsDialogOpen(true);
    });
  };

  const handleEditQuestionClick = (question: Question) => {
    requireAuth(() => {
      setEditingQuestion(question);
      setIsDialogOpen(true);
    });
  };

  const handleDeleteQuestionClick = (id: string) => {
    requireAuth(() => {
      if (window.confirm(`Are you sure you want to delete this question?`)) {
        handleDeleteQuestion(id);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Topic not found
        </h1>
        <Link
          href="/topics"
          className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          {tTopics("title")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/topics"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {tTopics("title")}
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: topic.color ? `${topic.color}20` : "#64748b20",
                color: topic.color || "#64748b",
              }}
            >
              <span className="text-2xl">📁</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {topic.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {topic.description || tTopics("subtitle")}
              </p>
            </div>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open: boolean) =>
              requireAuth(() => setIsDialogOpen(open))
            }
          >
            <DialogTrigger asChild>
              <Button onClick={handleCreateQuestionClick}>
                <Plus className="w-5 h-5 mr-2" />
                {t("addQuestion")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? t("editQuestion") : t("addNewQuestion")}
                </DialogTitle>
              </DialogHeader>
              <QuestionForm
                onCancel={handleDialogClose}
                onSubmit={
                  editingQuestion ? handleEditQuestion : handleCreateQuestion
                }
                isSubmitting={isSubmitting}
                initialData={
                  editingQuestion
                    ? {
                        title: editingQuestion.title,
                        content: editingQuestion.content,
                        answer: editingQuestion.answer || "",
                        topicId: editingQuestion.topicId,
                        level: editingQuestion.level,
                      }
                    : {
                        title: "",
                        content: "",
                        answer: "",
                        topicId: topic.id,
                        level: "junior",
                      }
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Questions List */}
      <QuestionList
        questions={questions}
        onEdit={handleEditQuestionClick}
        onDelete={handleDeleteQuestionClick}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
