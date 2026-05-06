import { Button } from "@/components/ui/button";
import type { Task } from "@/types";
import { Plus, Target } from "lucide-react";
import { TaskListItem } from "./TaskListItem";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onCreateTask: () => void;
}

export const TaskListView = ({
  tasks,
  onTaskClick,
  onCreateTask,
}: TaskListViewProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              Chưa có công nợ nào
            </h3>
            <p className="text-slate-500 text-sm">
              Tạo một công nợ mới để bắt đầu theo dõi
            </p>
            <Button onClick={onCreateTask} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Tạo công nợ
            </Button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskListItem
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task._id)}
            />
          ))
        )}
      </div>
    </div>
  );
};