"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Clock, Filter, X, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { practiceApi, topicsApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useLoginDialog } from "@/contexts/login-dialog-context";
import type {
  Topic,
  PracticeLogEntry,
  PaginatedResponse,
  QueryHistoryParams,
} from "@/types";
import { SelfRating } from "@/types";

const ratingColors: Record<string, string> = {
  poor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  fair: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  good: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  great: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function PracticeHistory() {
  const t = useTranslations("history");
  const tPractice = useTranslations("practice");
  const tAuth = useTranslations("auth");
  const { user, loading: authLoading } = useAuth();
  const { openDialog } = useLoginDialog();

  const [data, setData] = useState<PaginatedResponse<PracticeLogEntry> | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [page, setPage] = useState(1);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasFilters = selectedTopicId !== "" || selectedRating !== "" || dateFrom !== "" || dateTo !== "";

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: QueryHistoryParams = { page, limit: 20 };
      if (selectedTopicId) params.topicId = selectedTopicId;
      if (selectedRating) params.rating = selectedRating as SelfRating;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const result = await practiceApi.getHistory(params);
      setData(result);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  }, [user, page, selectedTopicId, selectedRating, dateFrom, dateTo]);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const data = await topicsApi.getAll();
        setTopics(data);
      } catch (error) {
        console.error("Failed to load topics", error);
      }
    };
    loadTopics();
  }, []);

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [user, loadHistory]);

  const clearFilters = () => {
    setSelectedTopicId("");
    setSelectedRating("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  if (authLoading) {
    return <HistorySkeleton />;
  }

  if (!user) {
    return (
      <div className="group relative overflow-hidden bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10 p-6 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
            <Lock className="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{t("title")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{tAuth("loginRequiredDesc")}</p>
          </div>
          <button
            onClick={() => openDialog()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            {tAuth("login")}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <HistorySkeleton />;
  }

  const entries = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5" />
        </div>

        <select
          value={selectedTopicId}
          onChange={(e) => { setSelectedTopicId(e.target.value); setPage(1); }}
          className="text-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
        >
          <option value="">{tPractice("filterByTopic")}</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>{topic.name}</option>
          ))}
        </select>

        <select
          value={selectedRating}
          onChange={(e) => { setSelectedRating(e.target.value); setPage(1); }}
          className="text-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
        >
          <option value="">{t("filterByRating")}</option>
          {Object.values(SelfRating).map((r) => (
            <option key={r} value={r}>{tPractice(`ratings.${r}`)}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          placeholder={t("dateFrom")}
          className="text-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          placeholder={t("dateTo")}
          className="text-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
            {tPractice("clearFilters")}
          </button>
        )}
      </div>

      {/* History List */}
      {entries.length === 0 ? (
        <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">{t("noHistory")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-200/60 dark:border-white/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {entry.questionTitle}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {entry.topicName && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: entry.topicColor ? `${entry.topicColor}20` : undefined,
                        color: entry.topicColor || undefined,
                      }}
                    >
                      {entry.topicName}
                    </span>
                  )}
                  <span className="uppercase">{entry.level}</span>
                  {entry.timeSpentSeconds != null && (
                    <span>{entry.timeSpentSeconds}s</span>
                  )}
                </div>
                {entry.notes && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic">
                    {entry.notes}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 sm:flex-shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${ratingColors[entry.rating] || ""}`}
                >
                  {tPractice(`ratings.${entry.rating}`)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {new Date(entry.practicedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-200/60 dark:border-white/10 p-4"
        >
          <div className="animate-pulse flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
