import { PracticeSession } from "@/components/practice/PracticeSession";
import { PracticeStatsComponent } from "@/components/practice/PracticeStats";
import { DueForReview } from "@/components/practice/DueForReview";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PracticePage() {
  const t = useTranslations("practice");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {t("subtitle")}
            </p>
          </div>
          <PracticeSession />
        </div>
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white dark:from-orange-600 dark:to-red-600">
            <Play className="w-8 h-8 mb-2" />
            <h3 className="font-bold text-lg mb-2">{t("dueForReview")}</h3>
            <p className="text-sm opacity-90 mb-4">{t("dueForReviewDesc")}</p>
          </div>
          <DueForReview />
          <PracticeStatsComponent />
        </div>
      </div>
    </div>
  );
}
