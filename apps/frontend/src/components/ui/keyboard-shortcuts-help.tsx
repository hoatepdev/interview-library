"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  shortcuts: Shortcut[];
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const shortcutCategories: ShortcutCategory[] = [
    {
      category: "General",
      shortcuts: [
        {
          keys: isMac ? ["⌘", "K"] : ["Ctrl", "K"],
          description: "Open command palette",
        },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["/"], description: "Focus search" },
        { keys: ["Esc"], description: "Clear focus / Close dialog" },
      ],
    },
    {
      category: "Navigation",
      shortcuts: [
        { keys: ["g", "h"], description: "Go to Home" },
        { keys: ["g", "t"], description: "Go to Topics" },
        { keys: ["g", "q"], description: "Go to Questions" },
        { keys: ["g", "p"], description: "Go to Practice" },
        { keys: ["g", "s"], description: "Go to Settings" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-500" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutCategories.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-600 min-w-[2rem] text-center">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-slate-400 text-xs">then</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          <p>
            Tip: Most shortcuts work from anywhere in the app, except when
            typing in input fields.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
