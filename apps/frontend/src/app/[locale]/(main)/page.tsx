import { Link } from "@/i18n/routing";
import { BookOpen, Trophy, ArrowRight, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{t('welcome')}</h1>
        <p className="text-blue-100 dark:text-blue-200 mb-6 max-w-2xl">
          {t('subtitle', { count: 12 })}
        </p>
        <Link
          href="/practice"
          className="inline-flex items-center bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
        >
          {t('startPractice')}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none flex items-center space-x-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('totalTopics')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none flex items-center space-x-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('mastered')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none flex items-center space-x-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('practiceTime')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">4.5{t('hours')}</p>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('recentActivity')}</h2>
          <Link href="/history" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            {tCommon('viewAll')}
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Event Loop in JS</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">JavaScript • Senior</p>
              </div>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                Great
              </span>
            </div>
          </div>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">ACID Properties</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Database • Middle</p>
              </div>
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-1 rounded-full font-medium">
                Good
              </span>
            </div>
          </div>
          <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">React Fiber</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">React • Senior</p>
              </div>
              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs px-2 py-1 rounded-full font-medium">
                Poor
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
