"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Home,
  BookOpen,
  HelpCircle,
  Settings,
  Search,
  Zap,
  Command,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  action: () => void;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  category: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const t = useTranslations();
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const commands: Command[] = useMemo(
    () => [
      {
        id: "home",
        label: t("nav.home"),
        action: () => {
          router.push("/");
          onOpenChange(false);
        },
        icon: Home,
        shortcut: "g h",
        category: "Navigation",
      },
      {
        id: "topics",
        label: t("nav.topics"),
        action: () => {
          router.push("/topics");
          onOpenChange(false);
        },
        icon: BookOpen,
        shortcut: "g t",
        category: "Navigation",
      },
      {
        id: "questions",
        label: t("nav.questions"),
        action: () => {
          router.push("/questions");
          onOpenChange(false);
        },
        icon: HelpCircle,
        shortcut: "g q",
        category: "Navigation",
      },
      {
        id: "practice",
        label: t("nav.practice"),
        action: () => {
          router.push("/practice");
          onOpenChange(false);
        },
        icon: Zap,
        shortcut: "g p",
        category: "Navigation",
      },
      {
        id: "settings",
        label: t("nav.settings"),
        action: () => {
          router.push("/settings");
          onOpenChange(false);
        },
        icon: Settings,
        shortcut: "g s",
        category: "Navigation",
      },
      {
        id: "search",
        label: "Focus search",
        action: () => {
          onOpenChange(false);
          setTimeout(() => {
            const searchInput = document.querySelector(
              'input[type="text"]'
            ) as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }, 100);
        },
        icon: Search,
        shortcut: "/",
        category: "Actions",
      },
    ],
    [t, router, onOpenChange]
  );

  const filteredCommands = useMemo(() => {
    if (!search) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower)
    );
  }, [commands, search]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-slate-400" />
            <DialogTitle className="text-sm font-medium">
              Command Palette
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            autoFocus
          />
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {category}
                </div>
                <div className="space-y-1">
                  {cmds.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <cmd.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm text-slate-900 dark:text-white">
                          {cmd.label}
                        </span>
                      </div>
                      {cmd.shortcut && (
                        <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-600">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 flex items-center justify-between">
          <span>Press ? for help</span>
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              Esc
            </kbd>
            to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
