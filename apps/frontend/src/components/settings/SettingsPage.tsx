"use client";

import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Languages,
  Lock,
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  LogIn as LogInIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useLoginDialog } from "@/contexts/login-dialog-context";
import { LOCALE_LIST } from "@interview-library/shared/i18n";

export function SettingsPage() {
  const t = useTranslations("settings");
  const tRoles = useTranslations("roles");
  const tAuth = useTranslations("auth");
  const { user, loading } = useAuth();
  const { openDialog } = useLoginDialog();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const themes = [
    { value: "light", label: t("themeLight"), icon: Sun },
    { value: "dark", label: t("themeDark"), icon: Moon },
    { value: "system", label: t("themeSystem"), icon: Monitor },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <section className="relative rounded-3xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-50" />

        <div className="px-6 py-5 border-b border-slate-200/60 dark:border-white/5">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-500" />
            {t("profile")}
          </h2>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse ring-4 ring-slate-100 dark:ring-slate-800" />
              <div className="space-y-3">
                <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                <div className="h-4 w-56 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        ) : user ? (
          <div className="p-6 space-y-8">
            {/* Avatar + Name */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-20 dark:opacity-40 animate-pulse" />
                <Avatar
                  className="relative h-20 w-20 text-xl ring-4 ring-white dark:ring-slate-800 shadow-lg"
                  src={user.avatar}
                  alt={user.name}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {user.name}
                </h3>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                    {t("email")}
                  </p>
                  <p
                    className="text-sm font-medium text-slate-900 dark:text-white truncate"
                    title={user.email}
                  >
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="group flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <div className="p-2.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <LogInIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                    {t("provider")}
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                    {user.provider}
                  </p>
                </div>
              </div>
              <div className="group flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-colors sm:col-span-2 lg:col-span-1">
                <div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                    {t("role")}
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {tRoles(user.role)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="max-w-sm mx-auto flex flex-col items-center justify-center py-8 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-100 to-white dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border border-slate-200/50 dark:border-slate-600/50 shadow-sm">
                  <Lock className="w-8 h-8 text-slate-400 dark:text-slate-300" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t("profile")}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 px-4 leading-relaxed">
                  {t("loginToSeeProfile")} In order to manage your personal
                  settings, you need to sign in first.
                </p>
              </div>
              <button
                onClick={() => openDialog()}
                className="group relative flex items-center w-full justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <span>{tAuth("login")}</span>
                <LogInIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Appearance Section */}
      <section className="rounded-3xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="px-6 py-5 border-b border-slate-200/60 dark:border-white/5">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-500" />
            {t("appearance")}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 font-medium">
            {t("theme")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden",
                  theme === value
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:shadow-[0_0_15px_rgba(59,130,246,0.1)] -translate-y-1"
                    : "border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 bg-white/50 dark:bg-slate-800/30 hover:-translate-y-0.5 hover:bg-white dark:hover:bg-slate-800/50",
                )}
              >
                {/* Active indicator ring */}
                {theme === value && (
                  <div className="absolute inset-0 ring-1 ring-inset ring-blue-500/20 rounded-2xl" />
                )}

                <div
                  className={cn(
                    "p-3 rounded-full transition-colors duration-300",
                    theme === value
                      ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 scale-110"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700",
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tracking-wide",
                    theme === value
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-400",
                  )}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Language Section */}
      <section className="rounded-3xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none mb-8">
        <div className="px-6 py-5 border-b border-slate-200/60 dark:border-white/5">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Languages className="w-5 h-5 text-purple-500" />
            {t("language")}
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LOCALE_LIST.map((loc) => (
              <button
                key={loc.code}
                onClick={() => handleLocaleChange(loc.code)}
                disabled={isPending}
                className={cn(
                  "group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden",
                  locale === loc.code
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 bg-white/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/50",
                  isPending && "opacity-50 cursor-not-allowed",
                )}
              >
                {/* Visual marker inside button */}
                {locale === loc.code && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                )}

                <div
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-xl text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110",
                    locale === loc.code
                      ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      : "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50",
                  )}
                >
                  {loc.flag}
                </div>

                <div className="flex-1 text-left">
                  <span
                    className={cn(
                      "block text-base font-semibold",
                      locale === loc.code
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300",
                    )}
                  >
                    {loc.name}
                  </span>
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
                    {loc.code}
                  </span>
                </div>

                {locale === loc.code && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm mr-2 animate-in zoom-in spin-in-12 duration-300">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
