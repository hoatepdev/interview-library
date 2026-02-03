"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { questionsApi, Question, getTopics, Topic } from "@/lib/api";
import { QuestionList } from "@/components/questions/QuestionList";
import {
  Search,
  Plus,
  Filter,
  Star,
  Bookmark,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
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
import { useRequireAuth } from "@/hooks/use-require-auth";

// Filter presets
type FilterPreset = "all" | "favorites" | "need-practice" | "mastered";

const FILTER_PRESETS: Record<
  FilterPreset,
  { level?: string; status?: string; favorite?: boolean }
> = {
  all: {},
  favorites: { favorite: true },
  "need-practice": { status: "new" },
  mastered: { status: "mastered" },
};

function QuestionsContent() {
  const t = useTranslations("questions");
  const tNotif = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [activePreset, setActivePreset] = useState<FilterPreset>("all");

  // Build query params from URL
  const buildQueryParams = useCallback(() => {
    const params: Record<string, string> = {};
    const search = searchParams.get("search");
    const level = searchParams.get("level");
    const status = searchParams.get("status");
    const topic = searchParams.get("topic");
    const favorites = searchParams.get("favorites");

    if (search) params.search = search;
    if (level && level !== "all") params.level = level;
    if (status && status !== "all") params.status = status;
    if (topic && topic !== "all") params.topicId = topic;
    if (favorites === "true") params.favorite = "true";

    return params;
  }, [searchParams]);

  // Fetch questions with server-side filtering
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = buildQueryParams();
      const data = await questionsApi.getAll(params);
      setQuestions(data);
    } catch (error) {
      console.error("Failed to fetch questions", error);
      toast.error(tNotif("error"));
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams, tNotif]);

  useEffect(() => {
    fetchQuestions();
    getTopics().then(setTopics);
  }, [fetchQuestions]);

  // Detect active preset from URL
  useEffect(() => {
    const level = searchParams.get("level");
    const status = searchParams.get("status");
    const favorites = searchParams.get("favorites");

    if (favorites === "true") {
      setActivePreset("favorites");
    } else if (status === "new" && !level) {
      setActivePreset("need-practice");
    } else if (status === "mastered" && !level) {
      setActivePreset("mastered");
    } else {
      setActivePreset("all");
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateFilters = (
    updates: Record<string, string | boolean | undefined>
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === "all" ||
        value === "" ||
        value === false ||
        value === undefined
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Apply preset filter
  const applyPreset = (preset: FilterPreset) => {
    setActivePreset(preset);
    const config = FILTER_PRESETS[preset];

    if (preset === "all") {
      router.push("/questions", { scroll: false });
    } else {
      const params: Record<string, string> = {};
      if (config.favorite) params.favorites = "true";
      if (config.status) params.status = config.status;
      const query = new URLSearchParams(params).toString();
      router.push(`?${query}`, { scroll: false });
    }
    setIsFilterOpen(false);
  };

  // Individual filter handlers
  const handleSearchChange = (value: string) => {
    updateFilters({ search: value || undefined });
  };

  const handleLevelChange = (value: string) => {
    setActivePreset("all"); // Clear preset when using custom filter
    updateFilters({ level: value });
  };

  const handleStatusChange = (value: string) => {
    setActivePreset("all"); // Clear preset when using custom filter
    updateFilters({ status: value });
  };

  const handleTopicChange = (value: string) => {
    setActivePreset("all"); // Clear preset when using custom filter
    updateFilters({ topic: value });
  };

  const handleFavoritesToggle = () => {
    const currentValue = searchParams.get("favorites") === "true";
    setActivePreset("all"); // Clear preset when using custom filter
    updateFilters({ favorites: !currentValue });
  };

  const clearFilters = () => {
    setActivePreset("all");
    router.push("/questions", { scroll: false });
  };

  // Get current filter values from URL
  const currentLevel = searchParams.get("level") || "all";
  const currentStatus = searchParams.get("status") || "all";
  const currentTopic = searchParams.get("topic") || "all";
  const currentFavorites = searchParams.get("favorites") === "true";
  const currentSearch = searchParams.get("search") || "";

  const hasActiveFilters =
    activePreset !== "all" ||
    currentLevel !== "all" ||
    currentStatus !== "all" ||
    currentTopic !== "all" ||
    currentFavorites ||
    currentSearch;

  const handleCreateQuestion = async (data: Question) => {
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
      toast.success(tNotif("questionCreated"));
    } catch (error) {
      console.error("Failed to create question:", error);
      toast.error(tNotif("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = async (data: Question) => {
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

  const handleToggleFavorite = (id: string) => {
    requireAuth(async () => {
      try {
        await questionsApi.toggleFavorite(id);
        await fetchQuestions();
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        toast.error(tNotif("error"));
      }
    });
  };

  const handleEditClick = (question: Question) => {
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const activeFilterCount =
    (activePreset !== "all" ? 1 : 0) +
    [currentLevel, currentStatus, currentTopic].filter((f) => f !== "all")
      .length +
    (currentFavorites ? 1 : 0) +
    (currentSearch ? 1 : 0);

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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="space-x-2"
              onClick={() => setEditingQuestion(null)}
            >
              <Plus className="w-5 h-5" />
              <span>{t("addQuestion")}</span>
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
                  : undefined
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => applyPreset("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activePreset === "all" && !hasActiveFilters
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {t("allQuestions")}
        </button>
        <button
          onClick={() => applyPreset("favorites")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activePreset === "favorites"
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Star className="w-4 h-4" />
          {t("myFavorites")}
        </button>
        <button
          onClick={() => applyPreset("need-practice")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activePreset === "need-practice"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          {t("needPractice")}
        </button>
        <button
          onClick={() => applyPreset("mastered")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activePreset === "mastered"
              ? "bg-green-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {t("mastered")}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm dark:shadow-none"
            placeholder={t("searchPlaceholder")}
          />
          {currentSearch && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          )}
        </div>
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center space-x-2 px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200 font-medium">
              <Filter className="w-5 h-5" />
              <span>{t("filters")}</span>
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
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t("filters")}
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t("clearAll")}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("level")}
                </label>
                <select
                  value={currentLevel}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">{t("allLevels")}</option>
                  <option value="junior">{t("levels.junior")}</option>
                  <option value="middle">{t("levels.middle")}</option>
                  <option value="senior">{t("levels.senior")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("status")}
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">{t("allStatuses")}</option>
                  <option value="new">{t("statuses.new")}</option>
                  <option value="learning">{t("statuses.learning")}</option>
                  <option value="mastered">{t("statuses.mastered")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("topic")}
                </label>
                <select
                  value={currentTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">{t("allTopics")}</option>
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
                  checked={currentFavorites}
                  onChange={handleFavoritesToggle}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="favorites"
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  {t("favoritesOnly")}
                </label>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-none p-6 h-32 animate-pulse border border-gray-100 dark:border-gray-700"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <QuestionList
          questions={questions}
          onEdit={handleEditClick}
          onDelete={handleDeleteQuestion}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}

export default function QuestionsPage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">{tCommon("loading")}</div>
      }
    >
      <QuestionsContent />
    </Suspense>
  );
}
