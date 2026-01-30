import { PracticeSession } from "@/components/practice/PracticeSession";
import { PracticeStatsComponent } from "@/components/practice/PracticeStats";

export default function PracticePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Practice Mode</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Test your knowledge with random questions.
            </p>
          </div>
          <PracticeSession />
        </div>
        <div className="w-full lg:w-80">
          <PracticeStatsComponent />
        </div>
      </div>
    </div>
  );
}
