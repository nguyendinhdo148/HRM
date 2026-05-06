import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  FolderTree,
  BookOpen,
  ChevronRight,
  Calendar,
  ArrowUpRight,
} from "lucide-react";

interface TaskListItemProps {
  task: Task;
  onClick: () => void;
}

export const TaskListItem = ({ task, onClick }: TaskListItemProps) => {
  const assignees = (task as any).assignees || [];
  const story = (task as any).story;
  const epic = story?.epic;

  const statusColors = {
    "To do": "bg-slate-100 text-slate-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Done: "bg-green-100 text-green-700",
  };

  const statusLabels = {
    "To do": "To do",
    "In Progress": "Trả một phần",
    Done: "Hoàn thành",
  };

  // Tính toán số tiền còn lại
  const totalDebt = Number(task.title) || 0;
  const totalPaid = (task.subtasks || []).reduce((sum, sub) => {
    return sub.completed ? sum + (Number(sub.title) || 0) : sum;
  }, 0);
  const remainingDebt = totalDebt - totalPaid;

  return (
    <div
      onClick={onClick}
      className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-4 group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              statusColors[task.status as keyof typeof statusColors],
            )}
          >
            {statusLabels[task.status as keyof typeof statusLabels]}
          </span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              task.priority === "High"
                ? "bg-red-50 text-red-700"
                : task.priority === "Medium"
                  ? "bg-orange-50 text-orange-700"
                  : "bg-green-50 text-green-700",
            )}
          >
            {task.priority === "High" ? "Ưu tiên Cao" : task.priority === "Medium" ? "Ưu tiên TB" : "Ưu tiên Thấp"}
          </span>
          {epic && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded-md border border-purple-100">
                <FolderTree className="w-3 h-3 text-purple-500" />
                <span className="text-xs font-medium text-purple-700">
                  {epic.title}
                </span>
              </div>
              {story && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-md border border-green-100">
                    <BookOpen className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-medium text-green-700">
                      {story.title}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-baseline gap-2 mb-1">
            <h4 className="font-semibold text-destructive">
                Còn lại: {remainingDebt.toLocaleString("vi-VN")} ₫
            </h4>
            {totalPaid > 0 && (
                 <span className="text-xs text-muted-foreground line-through">
                    {totalDebt.toLocaleString("vi-VN")} ₫
                 </span>
            )}
        </div>

        {task.description && (
          <p className="text-sm text-slate-500 line-clamp-1">
            {task.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1">
          {assignees.slice(0, 2).map((member: any) => (
            <Avatar key={member._id} className="w-6 h-6 border-2 border-white">
              <AvatarImage src={member.profilePicture} />
              <AvatarFallback className="text-[10px] bg-slate-200">
                {member.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            {format(new Date(task.dueDate), "d MMM, yyyy", { locale: vi })}
          </div>
        )}
        <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};