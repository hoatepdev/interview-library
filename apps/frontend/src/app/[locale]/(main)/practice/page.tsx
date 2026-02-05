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
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400">
               {t("title")}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
              {t("subtitle")}
            </p>
          </div>
          <PracticeSession />
        </div>
        <div className="w-full lg:w-96 space-y-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20">
             <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl" />
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                   <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Play className="w-6 h-6 text-white" />
                   </div>
                   <h3 className="font-bold text-xl">{t("dueForReview")}</h3>
                </div>
                <p className="text-orange-50 text-sm leading-relaxed mb-4">{t("dueForReviewDesc")}</p>
             </div>
          </div>
          
          <DueForReview />
          <PracticeStatsComponent />
        </div>
      </div>
    </div>
  );
}
