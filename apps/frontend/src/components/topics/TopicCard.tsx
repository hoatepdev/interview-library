import { Topic } from "@/types";
import Link from "next/link";
import { ArrowRight, Code, Database, Server, Atom, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const icons: Record<string, any> = {
  code: Code,
  database: Database,
  server: Server,
  atom: Atom,
};

interface TopicCardProps {
  topic: Topic;
  onEdit?: (topic: Topic) => void;
  onDelete?: (id: string) => void;
}

export function TopicCard({ topic, onEdit, onDelete }: TopicCardProps) {
  const Icon = topic.icon && icons[topic.icon] ? icons[topic.icon] : Code;

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${topic.name}"?`)) {
      onDelete?.(topic.id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-all duration-300 p-6 flex flex-col h-full group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${topic.color || "bg-blue-100 dark:bg-blue-900/30"}`}>
          <Icon className="w-6 h-6" />
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(topic)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Edit topic"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete topic"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {topic.name}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex-1">{topic.description || "No description available."}</p>
      <div className="flex items-center justify-between mt-auto">
        <Link
          href={`/topics/${topic.id}`}
          className="flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View Questions
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
