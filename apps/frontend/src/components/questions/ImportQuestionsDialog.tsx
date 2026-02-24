"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { questionsApi } from "@/lib/api";
import type { ImportResult } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImportQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportQuestionsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportQuestionsDialogProps) {
  const t = useTranslations("questions");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setIsUploading(false);
    setResult(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(t("importNoFile"));
      return;
    }

    setIsUploading(true);
    try {
      const res = await questionsApi.importQuestions(file);
      setResult(res);

      if (res.imported > 0 && res.errors.length === 0) {
        toast.success(t("importSuccess", { count: res.imported }));
        onSuccess();
      } else if (res.imported > 0) {
        toast.success(
          t("importPartialSuccess", {
            imported: res.imported,
            skipped: res.skipped,
          })
        );
        onSuccess();
      } else {
        toast.error(t("importErrors", { count: res.errors.length }));
      }
    } catch {
      toast.error(t("importNoFile"));
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Subtle top glare effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            {t("importTitle")}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {t("importDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 relative z-10">
          {/* File input area */}
          <div
            className="group border-2 border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:bg-blue-500/5 transition-all duration-300 relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Glow on hover */}
            <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300 pointer-events-none" />
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3 relative z-10">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0">
                  <FileText className="h-6 w-6 drop-shadow-[0_0_8px_currentColor]" />
                </div>
                <div className="text-sm text-left">
                  <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{file.name}</p>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 dark:shadow-[0_0_20px_rgba(148,163,184,0.1)]">
                  <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-500 transition-colors">{t("importSelectFile")}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t("importAcceptedFormats")}
                </p>
              </div>
            )}
          </div>

          {/* Result display */}
          {result && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 relative z-10 shadow-inner">
              <div className="flex items-center gap-2.5 text-sm font-bold">
                {result.imported > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                )}
                <span className="text-slate-900 dark:text-white">
                  {result.errors.length === 0
                    ? t("importSuccess", { count: result.imported })
                    : t("importPartialSuccess", {
                        imported: result.imported,
                        skipped: result.skipped,
                      })}
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-3 text-xs space-y-1.5 custom-scrollbar">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-red-600 dark:text-red-400 font-medium flex gap-2">
                      <span className="opacity-70 mt-0.5">•</span>
                      <span>
                        {t("importErrorRow", {
                          row: err.row,
                          message: err.message,
                        })}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="relative z-10 pt-4 border-t border-slate-200/50 dark:border-white/10 mt-6">
          {result ? (
            <Button onClick={() => handleOpenChange(false)} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold transition-all shadow-md">
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="w-full sm:w-auto rounded-xl font-bold border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!file || isUploading}
                className="w-full sm:w-auto rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg dark:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:shadow-none"
              >
                {isUploading ? t("importUploading") : t("importButton")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
