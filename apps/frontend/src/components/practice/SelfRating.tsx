"use client";

import { Frown, Meh, Smile, Star } from "lucide-react";
import { SelfRating } from "@/types";

interface SelfRatingComponentProps {
  onRate: (rating: SelfRating) => void;
}

export function SelfRatingComponent({ onRate }: SelfRatingComponentProps) {
  return (
    <div className="mt-8">
      <h3 className="text-center text-gray-500 dark:text-gray-400 font-medium mb-4">How well did you know this?</h3>
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => onRate(SelfRating.POOR)}
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-105 transition-all"
        >
          <Frown className="w-6 h-6 mb-2" />
          <span className="text-sm font-semibold">Poor</span>
        </button>
        <button
          onClick={() => onRate(SelfRating.FAIR)}
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:scale-105 transition-all"
        >
          <Meh className="w-6 h-6 mb-2" />
          <span className="text-sm font-semibold">Fair</span>
        </button>
        <button
          onClick={() => onRate(SelfRating.GOOD)}
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:scale-105 transition-all"
        >
          <Smile className="w-6 h-6 mb-2" />
          <span className="text-sm font-semibold">Good</span>
        </button>
        <button
          onClick={() => onRate(SelfRating.GREAT)}
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-105 transition-all"
        >
          <Star className="w-6 h-6 mb-2" />
          <span className="text-sm font-semibold">Great</span>
        </button>
      </div>
    </div>
  );
}
