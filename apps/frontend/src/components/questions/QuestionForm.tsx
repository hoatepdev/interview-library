"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTopics, Topic } from "@/lib/api";

interface QuestionFormProps {
  onCancel: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    answer: string;
    topicId: string;
    level: string;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
  initialData?: {
    title: string;
    content: string;
    answer: string;
    topicId: string;
    level: string;
  };
}

export function QuestionForm({
  onCancel,
  onSubmit,
  isSubmitting = false,
  initialData,
}: QuestionFormProps) {
  const t = useTranslations("form");
  const tQuestions = useTranslations("questions");
  const tCommon = useTranslations("common");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    answer: initialData?.answer || "",
    topicId: initialData?.topicId || "",
    level: initialData?.level || "junior",
  });

  useEffect(() => {
    async function fetchTopics() {
      try {
        const data = await getTopics();
        setTopics(data);
      } catch (error) {
        console.error("Failed to fetch topics", error);
      }
    }
    fetchTopics();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        answer: initialData.answer,
        topicId: initialData.topicId,
        level: initialData.level,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isEditMode = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t("title")}</Label>
        <Input
          id="title"
          placeholder={t("enterTitle")}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="content">{t("questionContent")}</Label>
        <Textarea
          id="content"
          placeholder={t("enterContent")}
          className="min-h-25"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">{t("answerOptional")}</Label>
        <Textarea
          id="answer"
          placeholder={t("enterAnswer")}
          className="min-h-25"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEditMode
              ? t("updating")
              : t("creating")
            : isEditMode
              ? t("updateQuestion")
              : t("createQuestion")}
        </Button>
      </div>
    </form>
  );
}
