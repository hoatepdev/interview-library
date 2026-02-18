"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { questionsApi, getTopics, Topic } from "@/lib/api";
import { QuestionLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ArrowLeft } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function NewQuestionPage() {
  const t = useTranslations("form");
  const tQuestions = useTranslations("questions");
  const tCommon = useTranslations("common");
  const tNotif = useTranslations("notifications");
  const router = useRouter();
  const { requireAuth } = useRequireAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    answer: "",
    topicId: "",
    level: "junior",
  });

  useEffect(() => {
    requireAuth(async () => {
      try {
        const data = await getTopics();
        setTopics(data);
      } catch (error) {
        console.error("Failed to fetch topics", error);
      }
    });
  }, [requireAuth]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await questionsApi.create({
        title: formData.title,
        content: formData.content,
        answer: formData.answer || undefined,
        topicId: formData.topicId,
        level: formData.level as QuestionLevel,
      });

      toast.success(tNotif("questionCreated"));
      router.push("/questions");
    } catch (error) {
      console.error("Failed to create question:", error);
      toast.error(tNotif("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/questions")}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {tQuestions("addNewQuestion")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t("createNewQuestion")}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("title")}</Label>
              <Input
                id="title"
                placeholder={t("enterTitle")}
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Topic and Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic">{t("topic")}</Label>
                <Select
                  value={formData.topicId}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, topicId: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectTopic")} />
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
                <Label htmlFor="level">{t("level")}</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, level: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">
                      {tQuestions("levels.junior")}
                    </SelectItem>
                    <SelectItem value="middle">
                      {tQuestions("levels.middle")}
                    </SelectItem>
                    <SelectItem value="senior">
                      {tQuestions("levels.senior")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content with Rich Text Editor */}
            <div className="space-y-2">
              <Label>{t("questionContent")}</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) =>
                  setFormData({ ...formData, content: value })
                }
                placeholder={t("enterContent")}
                disabled={isSubmitting}
                minHeight={300}
              />
            </div>

            {/* Answer with Rich Text Editor */}
            <div className="space-y-2">
              <Label>{t("answerOptional")}</Label>
              <RichTextEditor
                value={formData.answer}
                onChange={(value) =>
                  setFormData({ ...formData, answer: value })
                }
                placeholder={t("enterAnswer")}
                disabled={isSubmitting}
                minHeight={200}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/questions")}
            disabled={isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("creating") : t("createQuestion")}
          </Button>
        </div>
      </form>
    </div>
  );
}
