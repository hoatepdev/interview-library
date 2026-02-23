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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>{t("importDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input area */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{t("importSelectFile")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("importAcceptedFormats")}
                </p>
              </div>
            )}
          </div>

          {/* Result display */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {result.imported > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span>
                  {result.errors.length === 0
                    ? t("importSuccess", { count: result.imported })
                    : t("importPartialSuccess", {
                        imported: result.imported,
                        skipped: result.skipped,
                      })}
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded border bg-muted/50 p-2 text-xs space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-destructive">
                      {t("importErrorRow", {
                        row: err.row,
                        message: err.message,
                      })}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || isUploading}>
                {isUploading ? t("importUploading") : t("importButton")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
