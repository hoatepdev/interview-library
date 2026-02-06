import { Topic } from "@/types";
import Link from "next/link";
import {
  ArrowRight,
  Code,
  Database,
  Server,
  Atom,
  Pencil,
  Trash2,
  Cpu,
  Box,
  Layers,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

const icons: Record<string, any> = {
  code: Code,
  database: Database,
  server: Server,
  atom: Atom,
  cpu: Cpu,
  box: Box,
  layers: Layers,
  zap: Zap,
};

interface TopicCardProps {
  topic: Topic;
  onEdit?: (topic: Topic) => void;
  onDelete?: (id: string) => void;
}

export function TopicCard({ topic, onEdit, onDelete }: TopicCardProps) {
  const t = useTranslations("topics");
  const Icon = topic.icon && icons[topic.icon] ? icons[topic.icon] : Code;

  // Generate color styles dynamically or fallback to default Slate
  const color = topic.color || "#64748b"; // Default slate-500

  // Background with proper opacity for both light and dark modes
  const bgStyle = {
    backgroundColor: color ? `${color}15` : undefined, // Increased from 10 to 15 for better visibility
    borderColor: color ? `${color}25` : undefined, // Increased from 20 to 25
  };

  // Hover effect - stronger background on hover
  const hoverBgStyle = {
    backgroundColor: color ? `${color}25` : undefined, // Stronger on hover
    borderColor: color ? `${color}40` : undefined,
  };

  const glowStyle = {
    boxShadow: color ? `0 0 40px -10px ${color}40` : undefined, // Increased glow opacity
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(t("deleteConfirm", { name: topic.name }))) {
      onDelete?.(topic.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(topic);
  };

  return (
    <div
      className="group relative h-full flex flex-col rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-white/50 dark:bg-slate-900/50"
      style={bgStyle}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverBgStyle, glowStyle);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, bgStyle);
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-60"
        style={{ backgroundColor: color }}
      />

      <div className="relative p-6 flex flex-col h-full z-10">
        <div className="flex items-start justify-between mb-6">
          <div
            className="p-3.5 rounded-xl border border-white/10 shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            <Icon className="w-8 h-8" />
          </div>

          {(onEdit || onDelete) && (
            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  title={t("editTopic")}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  title={t("deleteConfirm", { name: topic.name })}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight transition-colors group-hover:opacity-90">
          {topic.name}
        </h3>

        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">
          {topic.description || "No description available."}
        </p>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {t("questionsCount", { count: topic.questionsCount || 0 })}
            </span>
          </div>

          <Link
            href={`/topics/${topic.slug}`}
            className="group/link flex items-center text-sm font-semibold transition-colors"
            style={{ color: color }}
          >
            {t("viewQuestions")}
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
