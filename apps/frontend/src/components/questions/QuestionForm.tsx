"use client";

import { useEffect, useState } from "react";
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
  onSubmit: (data: any) => void | Promise<void>;
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
  initialData
}: QuestionFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isEditMode = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g. Explain Event Loop"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Select
            value={formData.topicId}
            onValueChange={(value: string) => setFormData({ ...formData, topicId: value })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select topic" />
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
          <Label htmlFor="level">Level</Label>
          <Select
            value={formData.level}
            onValueChange={(value: string) => setFormData({ ...formData, level: value })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="junior">Junior</SelectItem>
              <SelectItem value="middle">Middle</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Question Content</Label>
        <Textarea
          id="content"
          placeholder="Detailed question behavior..."
          className="min-h-[100px]"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer (Optional)</Label>
        <Textarea
          id="answer"
          placeholder="Detailed answer/solution..."
          className="min-h-[100px]"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditMode ? "Updating..." : "Adding...") : isEditMode ? "Update Question" : "Add Question"}
        </Button>
      </div>
    </form>
  );
}
