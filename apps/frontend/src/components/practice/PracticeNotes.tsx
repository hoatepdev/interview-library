"use client";

import { Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface PracticeNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PracticeNotes({
  notes,
  onNotesChange,
  isExpanded,
  onToggle,
}: PracticeNotesProps) {
  const t = useTranslations("practice");

  return (
    <div className="mt-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>{t("addNotes")}</span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 fade-in">
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={t("notesPlaceholder")}
            maxLength={1000}
            rows={3}
            className="w-full text-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none transition-all"
          />
        </div>
      )}
    </div>
  );
}
