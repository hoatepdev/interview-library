"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { questionsApi, practiceApi, Question, getTopics, Topic } from "@/lib/api";
import { QuestionLevel } from "@/types";
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
  Clock,
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
type FilterPreset = "all" | "favorites" | "need-practice" | "mastered" | "due";

const FILTER_PRESETS: Record<
  FilterPreset,
  { level?: string; status?: string; favorite?: boolean }
> = {
  all: {},
  favorites: { favorite: true },
  "need-practice": { status: "new" },
  mastered: { status: "mastered" },
  due: {}, // Special case - fetches from different endpoint
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
  const [dueCount, setDueCount] = useState<number>(0);

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

    // Load due count for authenticated users
    const loadDueCount = async () => {
      try {
        const res = await practiceApi.getDueQuestionsCount();
        setDueCount(res.count);
      } catch {
        // Ignore error - likely not authenticated
      }
    };
    loadDueCount();
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

  // Fetch questions when switching away from due preset
  useEffect(() => {
    if (activePreset !== "due") {
      fetchQuestions();
    }
  }, [activePreset, fetchQuestions]);

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
    } else if (preset === "due") {
      // Fetch due questions from different endpoint
      fetchDueQuestions();
      setIsFilterOpen(false);
      return; // Don't update URL
    } else {
      const params: Record<string, string> = {};
      if (config.favorite) params.favorites = "true";
      if (config.status) params.status = config.status;
      const query = new URLSearchParams(params).toString();
      router.push(`?${query}`, { scroll: false });
    }
    setIsFilterOpen(false);
  };

  // Fetch due questions (special case)
  const fetchDueQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await practiceApi.getQuestionsDueForReview(100);
      setQuestions(data);
      // Update due count
      const countRes = await practiceApi.getDueQuestionsCount();
      setDueCount(countRes.count);
    } catch (error) {
      console.error("Failed to fetch due questions", error);
      toast.error(tNotif("error"));
    } finally {
      setIsLoading(false);
    }
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

  const handleCreateQuestion = async (data: {
    title: string;
    content: string;
    answer: string;
    topicId: string;
    level: string;
  }) => {
    setIsSubmitting(true);
    try {
      await questionsApi.create({
        title: data.title,
        content: data.content,
        answer: data.answer || undefined,
        topicId: data.topicId,
        level: data.level as QuestionLevel,
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

  const handleEditQuestion = async (data: {
    title: string;
    content: string;
    answer: string;
    topicId: string;
    level: string;
  }) => {
    if (!editingQuestion) return;

    setIsSubmitting(true);
    try {
      await questionsApi.update(editingQuestion.id, {
        title: data.title,
        content: data.content,
        answer: data.answer || undefined,
        topicId: data.topicId,
        level: data.level as QuestionLevel,
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

  const activeFilterCount =
    (activePreset !== "all" ? 1 : 0) +
    [currentLevel, currentStatus, currentTopic].filter((f) => f !== "all")
      .length +
    (currentFavorites ? 1 : 0) +
    (currentSearch ? 1 : 0);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            {t("title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
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
            <Button className="space-x-2" onClick={handleCreateQuestionClick}>
              <Plus className="w-5 h-5" />
              <span>{t("addQuestion")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%] max-w-2xl">
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
        <div className="sticky top-4 z-40 mb-8 p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={currentSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 rounded-xl border-none bg-slate-100/50 dark:bg-white/5 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white transition-all"
                placeholder={t("searchPlaceholder")}
              />
              {currentSearch && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto md:contents">
                  <div className="flex-1 md:flex-none flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 no-scrollbar md:no-scroll-reset w-full md:w-auto -mx-2 px-2 md:mx-0 md:px-0">
                      <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-white/10 mx-2 flex-shrink-0" />
                      <button
                      onClick={() => applyPreset("all")}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                          activePreset === "all" && !hasActiveFilters
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                      >
                      {t("allQuestions")}
                      </button>
                      <button
                      onClick={() => applyPreset("favorites")}
                      className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                          activePreset === "favorites"
                          ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 shadow-sm"
                          : "text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10"
                      }`}
                      title={t("myFavorites")}
                      >
                      <Star className={`w-5 h-5 ${activePreset === "favorites" ? "fill-current" : ""}`} />
                      </button>
                      <button
                      onClick={() => applyPreset("due")}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                          activePreset === "due"
                          ? "bg-orange-500 text-white shadow-md transform scale-105"
                          : dueCount > 0
                          ? "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                          : "text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                      }`}
                      title="Due for review"
                      >
                      <Clock className="w-4 h-4" />
                      <span>Due</span>
                      {dueCount > 0 && (
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                              activePreset === "due"
                              ? "bg-orange-600 text-white"
                              : "bg-orange-500 text-white"
                          }`}>
                          {dueCount}
                          </span>
                      )}
                      </button>
                  </div>
                  <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                      <PopoverTrigger asChild>
                          <button className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200/50 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors relative cursor-pointer ${activeFilterCount > 0 ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" : "text-slate-500 dark:text-slate-400"}`}>
                              <Filter className="w-5 h-5" />
                              {activeFilterCount > 0 && (
                                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900" />
                              )}
                          </button>
                      </PopoverTrigger>
                  <PopoverContent className="w-80 p-5 rounded-2xl shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700" align="end">
                      <div className="space-y-5">
                      <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <Filter className="w-4 h-4" />
                              {t("filters")}
                          </h3>
                          {hasActiveFilters && (
                          <button
                              onClick={clearFilters}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                              {t("clearAll")}
                          </button>
                          )}
                      </div>

                      <div className="space-y-4">
                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {t("level")}
                              </label>
                              <select
                              value={currentLevel}
                              onChange={(e) => handleLevelChange(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              >
                              <option value="all">{t("allLevels")}</option>
                              <option value="junior">{t("levels.junior")}</option>
                              <option value="middle">{t("levels.middle")}</option>
                              <option value="senior">{t("levels.senior")}</option>
                              </select>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {t("status")}
                              </label>
                              <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChange(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              >
                              <option value="all">{t("allStatuses")}</option>
                              <option value="new">{t("statuses.new")}</option>
                              <option value="learning">{t("statuses.learning")}</option>
                              <option value="mastered">{t("statuses.mastered")}</option>
                              </select>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {t("topic")}
                              </label>
                              <select
                              value={currentTopic}
                              onChange={(e) => handleTopicChange(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              >
                              <option value="all">{t("allTopics")}</option>
                              {topics.map((topic) => (
                                  <option key={topic.id} value={topic.id}>
                                  {topic.name}
                                  </option>
                              ))}
                              </select>
                          </div>
                          <label
                              htmlFor="favorites"
                              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                              <input
                                  type="checkbox"
                                  id="favorites"
                                  checked={currentFavorites}
                                  onChange={handleFavoritesToggle}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  {t("favoritesOnly")}
                              </span>
                          </label>
                      </div>
                    </div>
                  </PopoverContent>
              </Popover>
            </div>
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
            onEdit={handleEditQuestionClick}
            onDelete={handleDeleteQuestionClick}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense
      fallback={
        <div className="container mx-auto">{tCommon("loading")}</div>
      }
    >
      <QuestionsContent />
    </Suspense>
  );
}
