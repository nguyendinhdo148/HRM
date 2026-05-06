import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  FolderTree,
  BookOpen,
  ChevronRight,
  Calendar,
  GripVertical,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
}

export const SortableTaskCard = ({ task, onClick }: SortableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignees = (task as any).assignees || [];
  const story = (task as any).story;
  const epic = story?.epic;

  const priorityColors = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-orange-50 text-orange-700 border-orange-200",
    Low: "bg-green-50 text-green-700 border-green-200",
  };

  const priorityLabels = {
    High: "Cao",
    Medium: "TB",
    Low: "Thấp",
  };

  // Tính toán số tiền còn lại
  const totalDebt = Number(task.title) || 0;
  const totalPaid = (task.subtasks || []).reduce((sum, sub) => {
    return sub.completed ? sum + (Number(sub.title) || 0) : sum;
  }, 0);
  const remainingDebt = totalDebt - totalPaid;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="hover:shadow-md transition-all duration-200 border border-slate-100 hover:border-blue-200 group">
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full border",
                priorityColors[task.priority as keyof typeof priorityColors] ||
                  "bg-slate-100",
              )}
            >
              {priorityLabels[task.priority as keyof typeof priorityLabels] || task.priority}
            </span>
            <GripVertical className="w-3 h-3 text-slate-400" />
          </div>

          <div className="flex flex-col gap-0.5">
             <h4 className="font-semibold text-sm text-destructive line-clamp-2">
               Còn lại: {remainingDebt.toLocaleString("vi-VN")} ₫
             </h4>
             {totalPaid > 0 && (
                 <span className="text-[10px] text-muted-foreground line-through">
                    Tổng nợ: {totalDebt.toLocaleString("vi-VN")} ₫
                 </span>
             )}
          </div>

          {epic && (
            <div className="flex items-center gap-1.5 text-xs">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded-md border border-purple-100">
                <FolderTree className="w-3 h-3 text-purple-500" />
                <span className="font-medium text-purple-700 truncate max-w-[120px]">
                  {epic.title}
                </span>
              </div>
              {story && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-md border border-green-100">
                    <BookOpen className="w-3 h-3 text-green-500" />
                    <span className="font-medium text-green-700 truncate max-w-[120px]">
                      {story.title}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-1">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex -space-x-1">
              {assignees.slice(0, 3).map((member: any) => (
                <Avatar
                  key={member._id}
                  className="w-5 h-5 border-2 border-white"
                >
                  <AvatarImage src={member.profilePicture} />
                  <AvatarFallback className="text-[8px] bg-slate-200 text-slate-600">
                    {member.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {assignees.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] text-slate-600">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), "d MMM, yyyy", { locale: vi })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};