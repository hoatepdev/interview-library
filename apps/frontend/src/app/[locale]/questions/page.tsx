"use client";

import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { getQuestions, questionsApi, Question, getTopics, Topic } from "@/lib/api";
import { QuestionList } from "@/components/questions/QuestionList";
import { Search, Plus, Filter, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QuestionForm } from "@/components/questions/QuestionForm";
import { Button } from "@/components/ui/button";

function QuestionsContent() {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await getQuestions();
      setQuestions(data);
    } catch (error) {
      console.error("Failed to fetch questions", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    getTopics().then(setTopics);
  }, []);

  // Sync filters with URL params
  useEffect(() => {
    const search = searchParams.get("search") || "";
    const level = searchParams.get("level") || "all";
    const status = searchParams.get("status") || "all";
    const topic = searchParams.get("topic") || "all";
    const favorites = searchParams.get("favorites") === "true";

    setSearchQuery(search);
    setLevelFilter(level);
    setStatusFilter(status);
    setTopicFilter(topic);
    setFavoritesOnly(favorites);
  }, [searchParams]);

  // Update URL when filters change
  const updateFilters = (updates: Record<string, string | boolean>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "all" || value === "" || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateFilters({ search: value });
  };

  const handleLevelChange = (value: string) => {
    setLevelFilter(value);
    updateFilters({ level: value });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateFilters({ status: value });
  };

  const handleTopicChange = (value: string) => {
    setTopicFilter(value);
    updateFilters({ topic: value });
  };

  const handleFavoritesToggle = () => {
    const newValue = !favoritesOnly;
    setFavoritesOnly(newValue);
    updateFilters({ favorites: newValue });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLevelFilter("all");
    setStatusFilter("all");
    setTopicFilter("all");
    setFavoritesOnly(false);
    window.history.replaceState(null, "", "/");
  };

  const hasActiveFilters = levelFilter !== "all" || statusFilter !== "all" || topicFilter !== "all" || favoritesOnly;

  const handleCreateQuestion = async (data: any) => {
    setIsSubmitting(true);
    try {
      await questionsApi.create({
        title: data.title,
        content: data.content,
        answer: data.answer || undefined,
        topicId: data.topicId,
        level: data.level,
      });

      setIsDialogOpen(false);
      await fetchQuestions();
      toast.success("Question created successfully");
    } catch (error) {
      console.error("Failed to create question:", error);
      toast.error("Failed to create question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = async (data: any) => {
    if (!editingQuestion) return;

    setIsSubmitting(true);
    try {
      await questionsApi.update(editingQuestion.id, {
        title: data.title,
        content: data.content,
        answer: data.answer || undefined,
        topicId: data.topicId,
        level: data.level,
      });

      setIsDialogOpen(false);
      setEditingQuestion(null);
      await fetchQuestions();
      toast.success("Question updated successfully");
    } catch (error) {
      console.error("Failed to update question:", error);
      toast.error("Failed to update question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await questionsApi.delete(id);
      await fetchQuestions();
      toast.success("Question deleted successfully");
    } catch (error) {
      console.error("Failed to delete question:", error);
      toast.error("Failed to delete question. Please try again.");
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await questionsApi.toggleFavorite(id);
      await fetchQuestions();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite. Please try again.");
    }
  };

  const handleEditClick = (question: Question) => {
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  // Filter questions based on all filters
  const filteredQuestions = questions.filter((question) => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === "" ||
      question.title.toLowerCase().includes(query) ||
      question.content.toLowerCase().includes(query) ||
      (question.answer && question.answer.toLowerCase().includes(query)) ||
      question.level.toLowerCase().includes(query) ||
      question.status.toLowerCase().includes(query);

    // Level filter
    const matchesLevel = levelFilter === "all" || question.level === levelFilter;

    // Status filter
    const matchesStatus = statusFilter === "all" || question.status === statusFilter;

    // Topic filter
    const matchesTopic = topicFilter === "all" || question.topicId === topicFilter;

    // Favorites filter
    const matchesFavorites = !favoritesOnly || question.isFavorite;

    return matchesSearch && matchesLevel && matchesStatus && matchesTopic && matchesFavorites;
  });

  const activeFilterCount = [levelFilter, statusFilter, topicFilter].filter(f => f !== "all").length + (favoritesOnly ? 1 : 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Questions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Browse and manage interview questions.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="space-x-2" onClick={() => setEditingQuestion(null)}>
              <Plus className="w-5 h-5" />
              <span>Add Question</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
            </DialogHeader>
            <QuestionForm
              onCancel={handleDialogClose}
              onSubmit={editingQuestion ? handleEditQuestion : handleCreateQuestion}
              isSubmitting={isSubmitting}
              initialData={editingQuestion ? {
                title: editingQuestion.title,
                content: editingQuestion.content,
                answer: editingQuestion.answer || "",
                topicId: editingQuestion.topicId,
                level: editingQuestion.level,
              } : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:shadow-none"
            placeholder="Search questions..."
          />
        </div>
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center space-x-2 px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200 font-medium">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Level</label>
                <select
                  value={levelFilter}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="learning">Learning</option>
                  <option value="mastered">Mastered</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Topic</label>
                <select
                  value={topicFilter}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Topics</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="favorites"
                  checked={favoritesOnly}
                  onChange={handleFavoritesToggle}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="favorites" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Favorites only
                </label>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-none p-6 h-32 animate-pulse border border-gray-100 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <QuestionList
          questions={filteredQuestions}
          onEdit={handleEditClick}
          onDelete={handleDeleteQuestion}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <QuestionsContent />
    </Suspense>
  );
}
