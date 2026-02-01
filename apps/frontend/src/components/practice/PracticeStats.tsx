"use client";

import { useEffect, useState } from "react";
import { practiceApi } from "@/lib/api";
import { PracticeStats } from "@/types";

export function PracticeStatsComponent() {
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await practiceApi.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Session Stats</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate "correct streak" approximation based on good/great ratings
  const positiveRatings = (stats.practiceByRating?.good || 0) + (stats.practiceByRating?.great || 0);
  const totalRatings = stats.totalPracticeSessions || 1;
  const accuracy = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Practice Stats</h3>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 dark:text-gray-400">Total Questions</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{stats.totalQuestions}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 dark:text-gray-400">Practice Sessions</span>
        <span className="font-bold text-blue-600 dark:text-blue-400">{stats.totalPracticeSessions}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 dark:text-gray-400">Time Spent</span>
        <span className="font-bold text-purple-600 dark:text-purple-400">{stats.totalPracticeTimeMinutes}m</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 dark:text-gray-400">Need Review</span>
        <span className="font-bold text-orange-600 dark:text-orange-400">{stats.questionsNeedingReview}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 dark:text-gray-400">Positive Ratings</span>
        <span className="font-bold text-green-600 dark:text-green-400">
          {positiveRatings} 🎯
        </span>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Questions by Status</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">New</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{stats.questionsByStatus?.new || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Learning</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{stats.questionsByStatus?.learning || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Mastered</span>
            <span className="font-medium text-green-600 dark:text-green-400">{stats.questionsByStatus?.mastered || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
