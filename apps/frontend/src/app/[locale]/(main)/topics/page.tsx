"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getTopics, topicsApi, Topic } from "@/lib/api";
import { TopicCard } from "@/components/topics/TopicCard";
import { Search, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TopicForm } from "@/components/topics/TopicForm";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function TopicsPage() {
  const t = useTranslations("topics");
  const tNotif = useTranslations("notifications");
  const { requireAuth } = useRequireAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const data = await getTopics();
      setTopics(data);
    } catch (error) {
      console.error("Failed to fetch topics", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleCreateTopic = async (data: any) => {
    setIsSubmitting(true);
    try {
      await topicsApi.create({
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
      });

      setIsDialogOpen(false);
      await fetchTopics();
      toast.success(tNotif("topicCreated"));
    } catch (error) {
      console.error("Failed to create topic:", error);
      toast.error(tNotif("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTopic = async (data: any) => {
    if (!editingTopic) return;

    setIsSubmitting(true);
    try {
      await topicsApi.update(editingTopic.id, {
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
      });

      setIsDialogOpen(false);
      setEditingTopic(null);
      await fetchTopics();
      toast.success(tNotif("topicUpdated"));
    } catch (error) {
      console.error("Failed to update topic:", error);
      toast.error(tNotif("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      await topicsApi.delete(id);
      await fetchTopics();
      toast.success(tNotif("topicDeleted"));
    } catch (error) {
      console.error("Failed to delete topic:", error);
      toast.error(tNotif("error"));
    }
  };

  const handleEditClick = (topic: Topic) => {
    setEditingTopic(topic);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTopic(null);
  };

  // Filter topics based on search query
  const filteredTopics = topics.filter((topic) => {
    const query = searchQuery.toLowerCase();
    return (
      topic.name.toLowerCase().includes(query) ||
      (topic.description && topic.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t("subtitle")}
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open: boolean) =>
            requireAuth(() => setIsDialogOpen(open))
          }
        >
          <DialogTrigger asChild>
            <Button
              className="space-x-2"
              onClick={() => requireAuth(() => setEditingTopic(null))}
            >
              <Plus className="w-5 h-5" />
              <span>{t("createTopic")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTopic ? t("editTopic") : t("createNewTopic")}
              </DialogTitle>
            </DialogHeader>
            <TopicForm
              key={editingTopic?.id || "new"}
              onCancel={handleDialogClose}
              onSubmit={editingTopic ? handleEditTopic : handleCreateTopic}
              isSubmitting={isSubmitting}
              initialData={
                editingTopic
                  ? {
                      name: editingTopic.name,
                      description: editingTopic.description || "",
                      icon: editingTopic.icon || "code",
                      color: editingTopic.color || "#3b82f6",
                    }
                  : undefined
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:shadow-none"
          placeholder={t("searchPlaceholder")}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-none p-6 h-48 animate-pulse border border-gray-100 dark:border-gray-700"
            >
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onEdit={handleEditClick}
              onDelete={handleDeleteTopic}
            />
          ))}
        </div>
      )}
    </div>
  );
}
