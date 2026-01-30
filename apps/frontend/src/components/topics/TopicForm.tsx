"use client";

import { useState, useEffect } from "react";
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
import { Code, Database, Server, Atom, type LucideIcon } from "lucide-react";

const iconOptions = [
  { value: "code", label: "Code", icon: Code },
  { value: "database", label: "Database", icon: Database },
  { value: "server", label: "Server", icon: Server },
  { value: "atom", label: "Atom", icon: Atom },
];

const colorOptions = [
  { value: "bg-blue-100 text-blue-800", label: "Blue" },
  { value: "bg-green-100 text-green-800", label: "Green" },
  { value: "bg-yellow-100 text-yellow-800", label: "Yellow" },
  { value: "bg-purple-100 text-purple-800", label: "Purple" },
  { value: "bg-red-100 text-red-800", label: "Red" },
  { value: "bg-orange-100 text-orange-800", label: "Orange" },
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
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    icon: initialData?.icon || "code",
    color: initialData?.color || "bg-blue-100 text-blue-800",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        icon: initialData.icon,
        color: initialData.color,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isEditMode = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="e.g. JavaScript"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Topic description..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="icon">Icon</Label>
        <Select
          value={formData.icon}
          onValueChange={(value: string) => setFormData({ ...formData, icon: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select icon" />
          </SelectTrigger>
          <SelectContent>
            {iconOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Select
          value={formData.color}
          onValueChange={(value: string) => setFormData({ ...formData, color: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select color" />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${option.value.split(' ')[0]}`} />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : isEditMode ? "Update Topic" : "Create Topic"}
        </Button>
      </div>
    </form>
  );
}
