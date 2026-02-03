
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Rocket } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Glitchy 404 */}
        <div className="relative">
          <h1 className="text-[150px] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-400 dark:from-white dark:to-slate-800 select-none">
            404
          </h1>
          <div className="absolute inset-0 text-[150px] font-black tracking-tighter leading-none text-blue-500/20 blur-lg animate-pulse select-none" aria-hidden="true">
            404
          </div>
        </div>

        {/* Message */}
        <div className="mt-8 space-y-4 max-w-md">
          <div className="flex items-center justify-center space-x-3 text-blue-600 dark:text-blue-400 mb-4">
             <Rocket className="w-6 h-6 animate-bounce" />
             <span className="text-sm font-bold tracking-widest uppercase">{t("heading")}</span>
          </div>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {t("description")}
          </p>
        </div>

        {/* Action */}
        <div className="mt-12">
          <Link 
            href="/"
            className="group flex items-center px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-900 dark:text-white font-medium hover:scale-105 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            {t("returnHome")}
          </Link>
        </div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
  );
}
