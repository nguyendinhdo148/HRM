import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { GripVertical, Circle, Clock, CheckCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { TaskColumn } from "./TaskColumn";

interface TaskBoardViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskBoardView = ({
  tasks,
  onTaskClick,
  onStatusChange,
}: TaskBoardViewProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const todoTasks = tasks.filter((t) => t.status === "To do");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const doneTasks = tasks.filter((t) => t.status === "Done");

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const dragged = tasks.find((t) => t._id === event.active.id);
      if (dragged) setActiveTask(dragged);
    },
    [tasks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const draggedTask = tasks.find((t) => t._id === active.id);
      if (!draggedTask) return;

      let targetStatus: TaskStatus | null = null;

      if (
        over.id === "To do" ||
        over.id === "In Progress" ||
        over.id === "Done"
      ) {
        targetStatus = over.id as TaskStatus;
      } else {
        const overTask = tasks.find((t) => t._id === over.id);
        if (overTask) targetStatus = overTask.status;
      }

      if (targetStatus && targetStatus !== draggedTask.status) {
        onStatusChange(draggedTask._id, targetStatus);
      }
    },
    [tasks, onStatusChange],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TaskColumn
          id="To do"
          title="To do"
          icon={<Circle className="w-4 h-4" />}
          color="slate"
          tasks={todoTasks}
          onTaskClick={onTaskClick}
        />
        <TaskColumn
          id="In Progress"
          title="Trả một phần"
          icon={<Clock className="w-4 h-4" />}
          color="blue"
          tasks={inProgressTasks}
          onTaskClick={onTaskClick}
        />
        <TaskColumn
          id="Done"
          title="Hoàn thành"
          icon={<CheckCircle className="w-4 h-4" />}
          color="green"
          tasks={doneTasks}
          onTaskClick={onTaskClick}
        />
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-300 p-3 w-80">
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full border",
                  activeTask.priority === "High"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : activeTask.priority === "Medium"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-green-50 text-green-700 border-green-200",
                )}
              >
                {activeTask.priority === "High" ? "Cao" : activeTask.priority === "Medium" ? "TB" : "Thấp"}
              </span>
              <GripVertical className="w-3 h-3 text-slate-400" />
            </div>
            <h4 className="font-semibold text-sm text-destructive mt-2">
              {Number(activeTask.title).toLocaleString("vi-VN")} ₫
            </h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};