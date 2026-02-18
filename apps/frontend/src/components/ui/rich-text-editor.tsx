"use client";

import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Editor } from "@toast-ui/react-editor";

// Dynamically import Toast UI Editor to avoid SSR issues
const ToastEditor = dynamic(
  () => import("@toast-ui/react-editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => <Loader2 className="animate-spin w-6 h-6 text-slate-400" />
  }
);

const ToastViewer = dynamic(
  () => import("@toast-ui/react-editor").then((mod) => mod.Viewer),
  {
    ssr: false,
    loading: () => <Loader2 className="animate-spin w-6 h-6 text-slate-400" />
  }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  label?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "",
  disabled = false,
  minHeight = 200,
  label,
}: RichTextEditorProps) {
  const editorRef = useRef<Editor>(null);

  useEffect(() => {
    // Update editor content when value changes externally
    if (editorRef.current) {
      const editorInstance = editorRef.current.getInstance();
      const currentValue = editorInstance.getMarkdown();

      if (currentValue !== value) {
        editorInstance.setMarkdown(value || "");
      }
    }
  }, [value]);

  const handleChange = () => {
    if (editorRef.current) {
      const editorInstance = editorRef.current.getInstance();
      const markdown = editorInstance.getMarkdown();
      onChange(markdown);
    }
  };

  return (
    <div className="rich-text-editor">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          {label}
        </label>
      )}
      <div className="toast-editor-wrapper border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <ToastEditor
          ref={editorRef}
          initialValue={value || ""}
          placeholder={placeholder}
          previewStyle="vertical"
          height={`${minHeight}px`}
          initialEditType="markdown"
          useCommandShortcut={true}
          hideModeSwitch={false}
          usageStatistics={false}
          onChange={handleChange}
          disabled={disabled}
          toolbarItems={[
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task'],
            ['table', 'link'],
            ['code', 'codeblock'],
          ]}
        />
      </div>
    </div>
  );
}

// Read-only preview component
interface RichTextPreviewProps {
  content: string;
  className?: string;
}

export function RichTextPreview({ content, className = "" }: RichTextPreviewProps) {
  if (!content) {
    return null;
  }

  return (
    <div className={`toast-viewer-wrapper ${className}`}>
      <ToastViewer initialValue={content} />
    </div>
  );
}
