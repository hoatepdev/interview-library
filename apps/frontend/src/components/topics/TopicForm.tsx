"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Code, Database, Server, Atom, Cpu, Box, Layers, Zap } from "lucide-react";

const iconOptions = [
  { value: "code", key: "code", icon: Code },
  { value: "database", key: "database", icon: Database },
  { value: "server", key: "server", icon: Server },
  { value: "atom", key: "atom", icon: Atom },
  { value: "cpu", key: "cpu", icon: Cpu },
  { value: "box", key: "box", icon: Box },
  { value: "layers", key: "layers", icon: Layers },
  { value: "zap", key: "zap", icon: Zap },
];

// Color mapping: value for storage (hex) + translation key
const colorOptions = [
  { value: "#3b82f6", key: "blue" },
  { value: "#22c55e", key: "green" },
  { value: "#eab308", key: "yellow" },
  { value: "#a855f7", key: "purple" },
  { value: "#ef4444", key: "red" },
  { value: "#f97316", key: "orange" },
  { value: "#06b6d4", key: "cyan" },
  { value: "#ec4899", key: "pink" },
  { value: "#6366f1", key: "indigo" },
  { value: "#64748b", key: "slate" },
];

interface TopicFormProps {
  onCancel: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    icon: string;
    color: string;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
  initialData?: {
    name: string;
    description: string;
    icon: string;
    color: string;
  };
}

export function TopicForm({
  onCancel,
  onSubmit,
  isSubmitting = false,
  initialData
}: TopicFormProps) {
  const t = useTranslations('form');
  const tCommon = useTranslations('common');

  // Use initialData directly as default, avoiding useEffect
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    icon: initialData?.icon || "code",
    color: initialData?.color || "#3b82f6",
  });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isEditMode = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('name')}</Label>
        <Input
          id="name"
          placeholder={t('enterName')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t('description')}</Label>
        <Textarea
          id="description"
          placeholder={t('enterDescription')}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="icon">{t('icon')}</Label>
        <Select
          value={formData.icon}
          onValueChange={(value: string) => setFormData({ ...formData, icon: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectTopic')} />
          </SelectTrigger>
          <SelectContent>
            {iconOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{t.raw(`icons.${option.key}`)}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">{t('color')}</Label>
        <Select
          value={formData.color}
          onValueChange={(value: string) => setFormData({ ...formData, color: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('color')} />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: option.value }}
                  />
                  <span>{t.raw(`colors.${option.key}`)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? (isEditMode ? t('updating') : t('creating'))
            : isEditMode
            ? t('updateTopic')
            : t('createTopic')}
        </Button>
      </div>
    </form>
  );
}
