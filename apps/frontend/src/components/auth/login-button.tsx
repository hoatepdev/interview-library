"use client";

import clsx from "clsx";

export function LoginButton() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <a
        href="/api/auth/google"
        className={clsx(
          "group relative flex items-center justify-center gap-3 px-6 py-3.5",
          "bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10",
          "text-slate-700 dark:text-white rounded-xl",
          "border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
          "transition-all duration-300 ease-out",
          "shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
          "hover:-translate-y-0.5"
        )}
      >
        <svg
          className="w-5 h-5 transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            className="text-[#4285F4]"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            className="text-[#34A853]"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            className="text-[#FBBC05]"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            className="text-[#EA4335]"
          />
        </svg>
        <span className="font-semibold tracking-wide">
          Continue with Google
        </span>
      </a>

      <a
        href="/api/auth/github"
        className={clsx(
          "group relative flex items-center justify-center gap-3 px-6 py-3.5",
          "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl",
          "hover:bg-slate-800 dark:hover:bg-slate-100",
          "transition-all duration-300 ease-out",
          "shadow-lg hover:shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]",
          "hover:-translate-y-0.5"
        )}
      >
        <svg
          className="w-5 h-5 transition-transform group-hover:scale-110"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.07-.21.07-.48 0-.705-.435-.82-.82-2.055-.82-2.055-1.34-2.705-2.62-2.705-3.14 0-5.69 2.55-5.69 5.69 0 3.14 2.55 5.69 5.69 5.69 1.33 0 2.63-.45 3.65-1.35.05.65.05 1.85-.705 1.85-.705.14 1.26.42 2.62 1.95 2.62 3.38 0 6.12-2.74 6.12-6.12 0-3.38-2.74-6.12-6.12-6.12zm0 10.84c-2.59 0-4.69-2.1-4.69-4.69s2.1-4.69 4.69-4.69 4.69 2.1 4.69 4.69-2.1 4.69-4.69 4.69z" />
        </svg>
        <span className="font-semibold tracking-wide">
          Continue with GitHub
        </span>
      </a>
    </div>
  );
}
