"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette } from "@/components/ui/command-palette";
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Exception: Allow Cmd/Ctrl+K even in inputs
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
        return;
      }

      // Cmd/Ctrl + K: Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // ?: Show keyboard shortcuts help
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsHelpOpen(true);
        return;
      }

      // /: Focus search
      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="text"]'
        ) as HTMLInputElement;
        if (searchInput) searchInput.focus();
        return;
      }

      // Escape: Clear focus or close modals
      if (e.key === "Escape") {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else if (shortcutsHelpOpen) {
          setShortcutsHelpOpen(false);
        } else {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement) activeElement.blur();
        }
        return;
      }

      // Handle "g" key sequence for navigation
      if (e.key === "g") {
        setPendingKey("g");
        // Clear pending key after 1 second
        setTimeout(() => setPendingKey(null), 1000);
        return;
      }

      // Handle second key in "g" sequence
      if (pendingKey === "g") {
        setPendingKey(null);
        switch (e.key) {
          case "h":
            router.push("/");
            break;
          case "t":
            router.push("/topics");
            break;
          case "q":
            router.push("/questions");
            break;
          case "p":
            router.push("/practice");
            break;
          case "s":
            router.push("/settings");
            break;
        }
      }
    },
    [router, commandPaletteOpen, shortcutsHelpOpen, pendingKey]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="hidden md:flex h-full">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scroll-smooth">
            <div className="mx-auto max-w-7xl w-full">{children}</div>
          </main>
        </div>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />
    </>
  );
}
