import { PracticeHistory } from "@/components/practice/PracticeHistory";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

export default function PracticeHistoryPage() {
  const t = useTranslations("history");

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400">
          {t("title")}
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          {t("subtitle")}
        </p>
      </div>
      <PracticeHistory />
    </div>
  );
}
