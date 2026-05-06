import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTaskCard } from "./SortableTaskCard";

interface TaskColumnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: "slate" | "blue" | "green";
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export const TaskColumn = ({
  id,
  title,
  icon,
  color,
  tasks,
  onTaskClick,
}: TaskColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const colorClasses = {
    slate: "bg-slate-50 border-slate-200",
    blue: "bg-blue-50/30 border-blue-200",
    green: "bg-green-50/30 border-green-200",
  };

  const headerColors = {
    slate: "text-slate-700",
    blue: "text-blue-700",
    green: "text-green-700",
  };

  const badgeColors = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border transition-all duration-200",
        colorClasses[color],
        isOver && "ring-2 ring-blue-400 ring-opacity-50 shadow-lg",
      )}
    >
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg", badgeColors[color])}>
              {icon}
            </div>
            <h3 className={cn("font-semibold", headerColors[color])}>
              {title}
            </h3>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-full",
              badgeColors[color],
            )}
          >
            {tasks.length}
          </span>
        </div>
      </div>
      <SortableContext
        items={tasks.map((t) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-3 space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto min-h-[200px]">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <div
                className={cn(
                  "text-sm",
                  isOver ? "text-blue-500" : "text-slate-400",
                )}
              >
                {isOver ? "Thả công nợ vào đây" : "Kéo thả công nợ vào đây"}
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick(task._id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};