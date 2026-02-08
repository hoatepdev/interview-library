"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
  confirmText,
  cancelText,
  variant = "destructive",
}: ConfirmModalProps) {
  const t = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[95%]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:gap-0 sm:flex-row mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText || t("cancel")}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm();
              // Don't auto-close here, let the parent handle it or close after async
            }}
            disabled={isLoading}
          >
            {confirmText || t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
